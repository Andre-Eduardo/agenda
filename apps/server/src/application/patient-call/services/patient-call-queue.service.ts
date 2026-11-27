import {Inject, Injectable} from '@nestjs/common';
import {AttendanceScope} from '@application/attendance/services/attendance-scope.service';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import type {Actor} from '@domain/@shared/actor';
import {PreconditionException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {AtomicExecutor} from '@domain/@shared/repository';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import type {AppointmentId} from '@domain/appointment/entities';
import {AppointmentStatus} from '@domain/appointment/entities';
import {PatientCallRepository} from '@domain/patient-call/patient-call.repository';

type QueueAction = {kind: 'announce'; destination: string} | {kind: 'recall'; callCount: number};

@Injectable()
export class PatientCallQueueService {
    constructor(
        @Inject(PatientCallRepository) private readonly repository: PatientCallRepository,
        private readonly appointments: AppointmentRepository,
        private readonly patientAccess: PatientAccessChecker,
        private readonly atomic: AtomicExecutor,
        private readonly attendanceScope: AttendanceScope
    ) {}

    async list(actor: Actor) {
        const patientIds = await this.patientAccess.patientIdsForAction(actor, 'appointment');

        return this.repository.listQueue(actor.clinicId, patientIds);
    }

    announce(actor: Actor, id: AppointmentId, place: 'ROOM' | 'DESK', number: number) {
        const destination = place === 'ROOM' ? `Sala ${number}` : `Guichê ${number}`;

        return this.recordAnnouncement(actor, id, {kind: 'announce', destination});
    }

    recall(actor: Actor, id: AppointmentId, callCount: number) {
        return this.recordAnnouncement(actor, id, {kind: 'recall', callCount});
    }

    async remove(actor: Actor, id: AppointmentId, reason: string): Promise<void> {
        await this.atomic.runAtomically(async () => {
            await this.requireActiveEntry(actor, id);
            await this.repository.remove(actor.clinicId, id, actor.clinicMemberId, reason);
        });
    }

    private recordAnnouncement(actor: Actor, id: AppointmentId, action: QueueAction) {
        return this.atomic.runAtomically(async () => {
            const {entry, appointment} = await this.requireActiveEntryWithAppointment(actor, id);

            await this.attendanceScope.assertCanCall(actor, appointment);
            const destination = action.kind === 'announce' ? action.destination : entry.destination;
            const expectedCount = action.kind === 'announce' ? 0 : action.callCount;

            if (entry.callCount !== expectedCount || destination === null) {
                throw new PreconditionException('Patient call changed. Reload the queue and try again.');
            }

            return this.repository.announce(actor.clinicId, id, actor.clinicMemberId, destination);
        });
    }

    private async requireActiveEntry(actor: Actor, id: AppointmentId) {
        return (await this.requireActiveEntryWithAppointment(actor, id)).entry;
    }

    private async requireActiveEntryWithAppointment(actor: Actor, id: AppointmentId) {
        await this.repository.lockAppointment(actor.clinicId, id);
        const appointment = await this.appointments.findById(id);

        if (appointment === null || !appointment.clinicId.equals(actor.clinicId)) {
            throw new ResourceNotFoundException('Appointment not found.');
        }

        await this.patientAccess.assertCanAccess(actor, appointment.patientId, 'appointment');

        const entry = await this.repository.findEntry(actor.clinicId, id);

        if (entry === null || appointment.status !== AppointmentStatus.ARRIVED) {
            throw new PreconditionException('Patient is no longer waiting in the call queue.');
        }

        return {entry, appointment};
    }
}
