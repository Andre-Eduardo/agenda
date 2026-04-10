import {Injectable} from '@nestjs/common';
import {Appointment} from '../../../domain/appointment/entities';
import {AppointmentRepository} from '../../../domain/appointment/appointment.repository';
import {ProfessionalRepository} from '../../../domain/professional/professional.repository';
import {PatientRepository} from '../../../domain/patient/patient.repository';
import {WorkingHoursRepository} from '../../../domain/professional/working-hours.repository';
import {ProfessionalBlockRepository} from '../../../domain/professional/professional-block.repository';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {AppointmentDto, CreateAppointmentDto} from '../dtos';
import {ResourceNotFoundException, PreconditionException, InvalidInputException} from '../../../domain/@shared/exceptions';

@Injectable()
export class CreateAppointmentService implements ApplicationService<CreateAppointmentDto, AppointmentDto> {
    constructor(
        private readonly appointmentRepository: AppointmentRepository,
        private readonly professionalRepository: ProfessionalRepository,
        private readonly patientRepository: PatientRepository,
        private readonly workingHoursRepository: WorkingHoursRepository,
        private readonly professionalBlockRepository: ProfessionalBlockRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreateAppointmentDto>): Promise<AppointmentDto> {
        const {patientId, professionalId, startAt, endAt, type, note, retroactive} = payload;

        // 1. Verificar que professional existe
        const professional = await this.professionalRepository.findById(professionalId);
        if (!professional) {
            throw new ResourceNotFoundException('Professional not found.', professionalId.toString());
        }

        // 2. Verificar que patient existe e pertence ao professional
        const patient = await this.patientRepository.findById(patientId);
        if (!patient) {
            throw new ResourceNotFoundException('Patient not found.', patientId.toString());
        }

        if (patient.professionalId !== null && patient.professionalId.toString() !== professionalId.toString()) {
            throw new PreconditionException('Patient does not belong to this professional.');
        }

        // 3. Validar que startAt < endAt
        if (startAt >= endAt) {
            throw new InvalidInputException('endAt must be after startAt', [
                {field: 'endAt', reason: 'endAt must be after startAt'},
            ]);
        }

        // 4. Validar que startAt não está no passado (exceto flag retroativo)
        if (!retroactive && startAt < new Date()) {
            throw new InvalidInputException('startAt cannot be in the past', [
                {field: 'startAt', reason: 'startAt cannot be in the past'},
            ]);
        }

        // 5. Verificar WorkingHours do professional no dayOfWeek
        const dayOfWeek = startAt.getDay();
        const workingHours = await this.workingHoursRepository.findByProfessionalAndDay(professionalId, dayOfWeek);

        if (workingHours.length > 0) {
            const coversInterval = workingHours.some((wh) => wh.coversInterval(startAt, endAt));
            if (!coversInterval) {
                throw new PreconditionException('Appointment is outside the professional working hours.');
            }
        }

        // 6. Verificar ProfessionalBlocks que se sobreponham ao intervalo
        const blocks = await this.professionalBlockRepository.findOverlapping(professionalId, startAt, endAt);
        if (blocks.length > 0) {
            throw new PreconditionException('Professional has a block during this time period.');
        }

        // 7. Verificar conflito com agendamentos ativos
        const conflicts = await this.appointmentRepository.findConflicts(professionalId, startAt, endAt);
        if (conflicts.length > 0) {
            throw new PreconditionException('There is a scheduling conflict with an existing appointment.');
        }

        // 8. Calcular durationMinutes e gravar
        const durationMinutes = Math.round((endAt.getTime() - startAt.getTime()) / 60000);

        const appointment = Appointment.create({
            patientId,
            professionalId,
            startAt,
            endAt,
            durationMinutes,
            type,
            note: note ?? null,
        });

        await this.appointmentRepository.save(appointment);

        this.eventDispatcher.dispatch(actor, appointment);

        return new AppointmentDto(appointment);
    }
}
