import {Inject, Injectable} from '@nestjs/common';
import {
    AppointmentTriageDto,
    AttendanceCallResultDto,
    AttendanceItemDto,
    AttendanceQueueDto,
    type ListAttendanceDto,
    type SaveTriageDto,
} from '@application/attendance/dtos';
import {AttendanceScope} from '@application/attendance/services/attendance-scope.service';
import {AppointmentDto} from '@application/appointment/dtos';
import type {Actor} from '@domain/@shared/actor';
import {PreconditionException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {AtomicExecutor} from '@domain/@shared/repository';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {type Appointment, type AppointmentId, AppointmentStatus} from '@domain/appointment/entities';
import {AttendanceRepository} from '@domain/attendance/attendance.repository';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {EventDispatcher} from '@domain/event';
import {PatientCallRepository} from '@domain/patient-call/patient-call.repository';

export const PATIENT_NOT_WAITING = 'The patient is not waiting to be called.';
export const PATIENT_NOT_IN_ATTENDANCE = 'The patient is not in attendance.';

/**
 * Fluxo de atendimento: a recepção registra a chegada (check-in), a triagem libera o paciente
 * quando a clínica exige, o profissional (ou a recepção) chama informando a sala e, no fim,
 * finaliza. O profissional opera só a própria agenda; a recepção, as agendas a que tem acesso.
 */
@Injectable()
export class AttendanceService {
    constructor(
        @Inject(AttendanceRepository) private readonly attendance: AttendanceRepository,
        @Inject(PatientCallRepository) private readonly patientCall: PatientCallRepository,
        private readonly appointments: AppointmentRepository,
        private readonly members: ClinicMemberRepository,
        private readonly scope: AttendanceScope,
        private readonly atomic: AtomicExecutor,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async list(actor: Actor, {scope, dateFrom, dateTo}: ListAttendanceDto): Promise<AttendanceQueueDto> {
        const operable = await this.scope.operableAgendas(actor);
        const mineOnly = [actor.clinicMemberId];
        const attendedByMemberIds =
            scope === 'mine'
                ? operable === null || operable.some((id) => id.equals(actor.clinicMemberId))
                    ? mineOnly
                    : []
                : operable;
        const [items, triageRequired, panel] = await Promise.all([
            attendedByMemberIds !== null && attendedByMemberIds.length === 0
                ? Promise.resolve([])
                : this.attendance.list(actor.clinicId, {attendedByMemberIds, from: dateFrom, to: dateTo}),
            this.scope.triageRequired(actor),
            this.patientCall.getPanel(actor.clinicId),
        ]);
        const names = await this.members.findDisplayNamesByIds(actor.clinicId, [
            ...new Map(items.map((item) => [item.attendedByMemberId, ClinicMemberId.from(item.attendedByMemberId)])).values(),
        ]);

        return new AttendanceQueueDto(
            triageRequired,
            panel.enabled && panel.publicToken !== null,
            items.map(
                (item) =>
                    new AttendanceItemDto(item, {
                        attendedByName: names.get(item.attendedByMemberId) ?? null,
                        triageRequired,
                        mine: item.attendedByMemberId === actor.clinicMemberId.toString(),
                    })
            )
        );
    }

    /** Chama o paciente (ARRIVED → IN_PROGRESS) ou repete a chamada de quem já está em atendimento. */
    call(actor: Actor, id: AppointmentId, destination: string): Promise<AttendanceCallResultDto> {
        return this.atomic.runAtomically(async () => {
            const appointment = await this.lockOperable(actor, id);

            if (appointment.status === AppointmentStatus.ARRIVED) {
                await this.scope.assertCanCall(actor, appointment);

                // Pacientes que chegaram antes de o painel existir entram na fila agora.
                await this.patientCall.joinQueue(actor.clinicId, id, appointment.arrivedAt ?? new Date());
                const announced = await this.announce(actor, id, destination);
                const fromStatus = appointment.status;

                appointment.call();
                await this.appointments.saveStatusTransition(appointment, fromStatus, actor, null);
                this.atomic.defer(() => this.eventDispatcher.dispatch(actor, appointment));

                return new AttendanceCallResultDto(id.toString(), destination, announced);
            }

            if (appointment.status === AppointmentStatus.IN_PROGRESS) {
                return new AttendanceCallResultDto(id.toString(), destination, await this.announce(actor, id, destination));
            }

            throw new PreconditionException(PATIENT_NOT_WAITING);
        });
    }

    finish(actor: Actor, id: AppointmentId): Promise<AppointmentDto> {
        return this.atomic.runAtomically(async () => {
            const appointment = await this.lockOperable(actor, id);

            if (appointment.status !== AppointmentStatus.IN_PROGRESS) {
                throw new PreconditionException(PATIENT_NOT_IN_ATTENDANCE);
            }

            const fromStatus = appointment.status;

            appointment.complete();
            await this.appointments.saveStatusTransition(appointment, fromStatus, actor, null);
            this.atomic.defer(() => this.eventDispatcher.dispatch(actor, appointment));

            return new AppointmentDto(appointment);
        });
    }

    async getTriage(actor: Actor, id: AppointmentId): Promise<AppointmentTriageDto> {
        await this.requireOperable(actor, id);

        return new AppointmentTriageDto(id.toString(), await this.attendance.findTriage(actor.clinicId, id));
    }

    saveTriage(actor: Actor, id: AppointmentId, {release, ...fields}: SaveTriageDto): Promise<AppointmentTriageDto> {
        return this.atomic.runAtomically(async () => {
            const appointment = await this.lockOperable(actor, id);

            if (appointment.status !== AppointmentStatus.ARRIVED) {
                throw new PreconditionException(PATIENT_NOT_WAITING);
            }

            const triage = await this.attendance.saveTriage(
                actor.clinicId,
                id,
                actor.clinicMemberId,
                {
                    weightKg: fields.weightKg ?? null,
                    heightCm: fields.heightCm ?? null,
                    systolicPressure: fields.systolicPressure ?? null,
                    diastolicPressure: fields.diastolicPressure ?? null,
                    heartRate: fields.heartRate ?? null,
                    temperatureCelsius: fields.temperatureCelsius ?? null,
                    oxygenSaturation: fields.oxygenSaturation ?? null,
                    notes: fields.notes ? fields.notes : null,
                },
                release
            );

            return new AppointmentTriageDto(id.toString(), triage);
        });
    }

    private async announce(actor: Actor, id: AppointmentId, destination: string): Promise<boolean> {
        const panel = await this.patientCall.getPanel(actor.clinicId);

        if (!panel.enabled || panel.publicToken === null) return false;

        if (!(await this.patientCall.isAnnounceable(actor.clinicId, id))) return false;

        await this.patientCall.announce(actor.clinicId, id, actor.clinicMemberId, destination);

        return true;
    }

    private async lockOperable(actor: Actor, id: AppointmentId): Promise<Appointment> {
        await this.patientCall.lockAppointment(actor.clinicId, id);

        return this.requireOperable(actor, id);
    }

    private async requireOperable(actor: Actor, id: AppointmentId): Promise<Appointment> {
        const appointment = await this.appointments.findById(id);

        if (appointment === null || !appointment.clinicId.equals(actor.clinicId)) {
            throw new ResourceNotFoundException('Appointment not found.', id.toString());
        }

        await this.scope.assertCanOperate(actor, appointment.attendedByMemberId);

        return appointment;
    }
}
