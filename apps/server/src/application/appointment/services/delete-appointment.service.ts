import {Injectable} from '@nestjs/common';
import {z} from 'zod';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {getAppointmentSchema} from '@application/appointment/dtos';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {EventDispatcher} from '@domain/event';
import {PatientId} from '@domain/patient/entities';

type DeleteAppointmentDto = z.infer<typeof getAppointmentSchema>;

@Injectable()
export class DeleteAppointmentService implements ApplicationService<DeleteAppointmentDto> {
    constructor(
        private readonly patientAccessChecker: PatientAccessChecker,
        private readonly appointmentRepository: AppointmentRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<DeleteAppointmentDto>): Promise<void> {
        const appointment = await this.appointmentRepository.findById(payload.id);

        if (appointment === null) {
            throw new ResourceNotFoundException('Appointment not found.', payload.id.toString());
        }

        assertEntityBelongsToClinic(appointment.clinicId, actor.clinicId);
        await this.patientAccessChecker.assertCanAccess(
            actor,
            PatientId.from(appointment.patientId.toString()),
            'appointment'
        );

        appointment.delete();

        await this.appointmentRepository.delete(appointment.id);

        this.eventDispatcher.dispatch(actor, appointment);
    }
}
