import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException, InvalidInputException, PreconditionException} from '../../../domain/@shared/exceptions';
import {AppointmentRepository} from '../../../domain/appointment/appointment.repository';
import {WorkingHoursRepository} from '../../../domain/professional/working-hours.repository';
import {ProfessionalBlockRepository} from '../../../domain/professional/professional-block.repository';
import {UpdateAppointment} from '../../../domain/appointment/entities';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {AppointmentDto, UpdateAppointmentDto} from '../dtos';

@Injectable()
export class UpdateAppointmentService implements ApplicationService<UpdateAppointmentDto, AppointmentDto> {
    constructor(
        private readonly appointmentRepository: AppointmentRepository,
        private readonly workingHoursRepository: WorkingHoursRepository,
        private readonly professionalBlockRepository: ProfessionalBlockRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload: {id, ...props}}: Command<UpdateAppointmentDto>): Promise<AppointmentDto> {
        const appointment = await this.appointmentRepository.findById(id);

        if (appointment === null) {
            throw new ResourceNotFoundException('Appointment not found.', id.toString());
        }

        const rescheduling = props.startAt !== undefined || props.endAt !== undefined;

        const changeProps: UpdateAppointment = {
            type: props.type,
            note: props.note ?? undefined,
        };

        if (rescheduling) {
            const startAt = props.startAt ?? appointment.startAt;
            const endAt = props.endAt ?? appointment.endAt;

            if (startAt >= endAt) {
                throw new InvalidInputException('endAt must be after startAt', [
                    {field: 'endAt', reason: 'endAt must be after startAt'},
                ]);
            }

            const {professionalId} = appointment;

            // Verificar WorkingHours
            const dayOfWeek = startAt.getDay();
            const workingHours = await this.workingHoursRepository.findByProfessionalAndDay(professionalId, dayOfWeek);
            if (workingHours.length > 0) {
                const coversInterval = workingHours.some((wh) => wh.coversInterval(startAt, endAt));
                if (!coversInterval) {
                    throw new PreconditionException('Appointment is outside the professional working hours.');
                }
            }

            // Verificar ProfessionalBlocks
            const blocks = await this.professionalBlockRepository.findOverlapping(professionalId, startAt, endAt);
            if (blocks.length > 0) {
                throw new PreconditionException('Professional has a block during this time period.');
            }

            // Verificar conflitos, excluindo o próprio agendamento
            const conflicts = await this.appointmentRepository.findConflicts(professionalId, startAt, endAt, id);
            if (conflicts.length > 0) {
                throw new PreconditionException('There is a scheduling conflict with an existing appointment.');
            }

            changeProps.startAt = startAt;
            changeProps.endAt = endAt;
            changeProps.durationMinutes = Math.round((endAt.getTime() - startAt.getTime()) / 60000);
        }

        appointment.change(changeProps);

        await this.appointmentRepository.save(appointment);

        this.eventDispatcher.dispatch(actor, appointment);

        return new AppointmentDto(appointment);
    }
}
