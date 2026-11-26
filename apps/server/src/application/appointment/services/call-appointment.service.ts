import {Inject, Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {AppointmentDto, CallAppointmentDto} from '@application/appointment/dtos';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {PreconditionException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {EventDispatcher} from '@domain/event';
import {PatientCallRepository} from '@domain/patient-call/patient-call.repository';

@Injectable()
export class CallAppointmentService implements ApplicationService<CallAppointmentDto, AppointmentDto> {
    constructor(
        private readonly patientAccessChecker: PatientAccessChecker,
        private readonly appointmentRepository: AppointmentRepository,
        @Inject(PatientCallRepository) private readonly queue: PatientCallRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    execute(command: Command<CallAppointmentDto>): Promise<AppointmentDto> {
        return this.transition(command, false);
    }

    start(command: Command<CallAppointmentDto>): Promise<AppointmentDto> {
        return this.transition(command, true);
    }

    private async transition(
        {actor, payload: {id}}: Command<CallAppointmentDto>,
        usesQueue: boolean
    ): Promise<AppointmentDto> {
        const appointment = await this.appointmentRepository.findById(id);

        if (appointment === null) {
            throw new ResourceNotFoundException('Appointment not found.', id.toString());
        }

        assertEntityBelongsToClinic(appointment.clinicId, actor.clinicId);
        await this.patientAccessChecker.assertCanAccess(actor, appointment.patientId, 'appointment');

        if (usesQueue !== (await this.queue.isEnabled(actor.clinicId))) {
            throw new PreconditionException('Appointment start flow changed. Reload and try again.');
        }

        const fromStatus = appointment.status;

        appointment.call();

        await this.appointmentRepository.saveStatusTransition(appointment, fromStatus, actor, null);

        this.eventDispatcher.dispatch(actor, appointment);

        return new AppointmentDto(appointment);
    }
}
