import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {AppointmentStatusTransitionDto, GetAppointmentDto} from '@application/appointment/dtos';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {PatientId} from '@domain/patient/entities';

@Injectable()
export class ListAppointmentStatusTransitionsService implements ApplicationService<
    GetAppointmentDto,
    AppointmentStatusTransitionDto[]
> {
    constructor(
        private readonly patientAccessChecker: PatientAccessChecker,
        private readonly appointmentRepository: AppointmentRepository
    ) {}

    async execute({actor, payload: {id}}: Command<GetAppointmentDto>): Promise<AppointmentStatusTransitionDto[]> {
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

        const transitions = await this.appointmentRepository.listStatusTransitions(id, actor.clinicId);

        return transitions.map((transition) => new AppointmentStatusTransitionDto(transition));
    }
}
