import {Inject, Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {CheckinAppointmentDto, CheckinAppointmentResultDto} from '@application/appointment/dtos';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {AtomicExecutor} from '@domain/@shared/repository';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {AppointmentStatus} from '@domain/appointment/entities';
import {EventDispatcher} from '@domain/event';
import {PatientCallRepository} from '@domain/patient-call/patient-call.repository';

@Injectable()
export class CheckinAppointmentService implements ApplicationService<
    CheckinAppointmentDto,
    CheckinAppointmentResultDto
> {
    constructor(
        private readonly patientAccessChecker: PatientAccessChecker,
        private readonly appointmentRepository: AppointmentRepository,
        @Inject(PatientCallRepository) private readonly queue: PatientCallRepository,
        private readonly atomic: AtomicExecutor,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    execute({actor, payload: {id}}: Command<CheckinAppointmentDto>): Promise<CheckinAppointmentResultDto> {
        return this.atomic.runAtomically(async () => {
            await this.queue.lockAppointment(actor.clinicId, id);
            const appointment = await this.appointmentRepository.findById(id);

            if (appointment === null) {
                throw new ResourceNotFoundException('Appointment not found.', id.toString());
            }

            assertEntityBelongsToClinic(appointment.clinicId, actor.clinicId);
            await this.patientAccessChecker.assertCanAccess(actor, appointment.patientId, 'appointment');

            const fromStatus = appointment.status;

            if (fromStatus === AppointmentStatus.ARRIVED && (await this.queue.isEnabled(actor.clinicId))) {
                const code = await this.queue.joinQueue(actor.clinicId, id, appointment.arrivedAt ?? new Date());

                return new CheckinAppointmentResultDto(appointment, code);
            }

            appointment.checkin();
            await this.appointmentRepository.saveStatusTransition(appointment, fromStatus, actor, null);
            const code = await this.queue.joinQueue(actor.clinicId, id, appointment.arrivedAt ?? new Date());

            this.atomic.defer(() => this.eventDispatcher.dispatch(actor, appointment));

            return new CheckinAppointmentResultDto(appointment, code);
        });
    }
}
