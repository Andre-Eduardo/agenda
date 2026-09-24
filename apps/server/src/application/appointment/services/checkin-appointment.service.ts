import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {AppointmentDto, CheckinAppointmentDto} from '@application/appointment/dtos';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {EventDispatcher} from '@domain/event';
import {PatientId} from '@domain/patient/entities';

@Injectable()
export class CheckinAppointmentService implements ApplicationService<CheckinAppointmentDto, AppointmentDto> {
    constructor(
        private readonly patientAccessChecker: PatientAccessChecker,
        private readonly appointmentRepository: AppointmentRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload: {id}}: Command<CheckinAppointmentDto>): Promise<AppointmentDto> {
        const appointment = await this.appointmentRepository.findById(id);

        if (appointment === null) {
            throw new ResourceNotFoundException('Appointment not found.', id.toString());
        }

        assertEntityBelongsToClinic(appointment.clinicId, actor.clinicId);
        await this.patientAccessChecker.assertCanAccess(
            actor,
            PatientId.from(appointment.patientId.toString()),
            'appointment'
        );

        appointment.checkin();

        await this.appointmentRepository.save(appointment);

        this.eventDispatcher.dispatch(actor, appointment);

        return new AppointmentDto(appointment);
    }
}
