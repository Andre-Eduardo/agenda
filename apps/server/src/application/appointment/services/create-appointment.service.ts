import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {AppointmentDto, CreateAppointmentDto} from '@application/appointment/dtos';
import {AgendaAccessChecker} from '@application/professional-agenda-access/services';
import {InvalidInputException, PreconditionException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {Transactional} from '@domain/@shared/repository';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {Appointment} from '@domain/appointment/entities';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicRepository} from '@domain/clinic/clinic.repository';
import {ClinicId} from '@domain/clinic/entities';
import {EventDispatcher} from '@domain/event';
import {PatientRepository} from '@domain/patient/patient.repository';
import {MemberBlockRepository} from '@domain/professional/member-block.repository';
import {ProfessionalRepository} from '@domain/professional/professional.repository';
import {WorkingHoursRepository} from '@domain/professional/working-hours.repository';
import {RoomId} from '@domain/room/entities';
import {RoomRepository} from '@domain/room/room.repository';

@Injectable()
export class CreateAppointmentService implements ApplicationService<CreateAppointmentDto, AppointmentDto> {
    constructor(
        private readonly appointmentRepository: AppointmentRepository,
        private readonly clinicMemberRepository: ClinicMemberRepository,
        private readonly clinicRepository: ClinicRepository,
        private readonly patientRepository: PatientRepository,
        private readonly professionalRepository: ProfessionalRepository,
        private readonly roomRepository: RoomRepository,
        private readonly workingHoursRepository: WorkingHoursRepository,
        private readonly memberBlockRepository: MemberBlockRepository,
        private readonly agendaAccessChecker: AgendaAccessChecker,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    @Transactional()
    async execute({actor, payload}: Command<CreateAppointmentDto>): Promise<AppointmentDto> {
        const {patientId, attendedByMemberId, startAt, endAt, type, note, retroactive, confirmOutsideAvailability} =
            payload;

        // 1. Member who will attend must exist and belong to the actor's clinic.
        const attendedBy = await this.clinicMemberRepository.findById(attendedByMemberId);

        if (attendedBy === null) {
            throw new ResourceNotFoundException('clinic_member.not_found', attendedByMemberId.toString());
        }

        if (!attendedBy.clinicId.equals(actor.clinicId)) {
            throw new PreconditionException('Member does not belong to the current clinic.');
        }

        await this.agendaAccessChecker.assertCanManage(actor, attendedByMemberId);

        // 2. Patient must exist and belong to the same clinic (tenant boundary).
        const patient = await this.patientRepository.findById(patientId, actor.clinicId);

        if (patient === null) {
            throw new ResourceNotFoundException('patient.not_found', patientId.toString());
        }

        // 3. Time interval must be coherent.
        if (startAt >= endAt) {
            throw new InvalidInputException('endAt must be after startAt', [
                {field: 'endAt', reason: 'endAt must be after startAt'},
            ]);
        }

        // 4. Don't allow scheduling in the past unless explicitly marked retroactive.
        if (!retroactive && startAt < new Date()) {
            throw new InvalidInputException('startAt cannot be in the past', [
                {field: 'startAt', reason: 'startAt cannot be in the past'},
            ]);
        }

        // 5. Member should have working hours covering the interval (when defined).
        // Advisory only: the caller can bypass with confirmOutsideAvailability after
        // the user confirms the warning — see docs/frontend availability-warning flow.
        const dayOfWeek = startAt.getDay();
        const workingHours = await this.workingHoursRepository.findByMemberAndDay(attendedByMemberId, dayOfWeek);

        if (workingHours.length > 0) {
            const coversInterval = workingHours.some((wh) => wh.coversInterval(startAt, endAt));

            if (!coversInterval && !confirmOutsideAvailability) {
                throw new PreconditionException('appointment.outside_working_hours');
            }
        }

        // 6. Member should not have a block overlapping the interval. Advisory only (see above).
        const blocks = await this.memberBlockRepository.findOverlapping(attendedByMemberId, startAt, endAt);

        if (blocks.length > 0 && !confirmOutsideAvailability) {
            throw new PreconditionException('appointment.member_block');
        }

        // 7. No conflict with other active appointments for the same member. Hard block.
        // Acquire a transaction-scoped advisory lock first so two concurrent requests for the
        // same member can't both pass this check before either one saves (TOCTOU race).
        await this.appointmentRepository.lockMemberSchedule(attendedByMemberId);

        const conflicts = await this.appointmentRepository.findConflicts(attendedByMemberId, startAt, endAt);

        if (conflicts.length > 0) {
            throw new PreconditionException('There is a scheduling conflict with an existing appointment.');
        }

        // 8. Resolve the room (only when the clinic uses room management) and hard-block
        // on physical double-booking — unlike availability, two appointments genuinely
        // cannot share the same room at the same time.
        const roomId = await this.resolveRoom(actor.clinicId, attendedByMemberId, payload.roomId ?? null);

        if (roomId !== null) {
            await this.appointmentRepository.lockRoomSchedule(roomId);

            const roomConflicts = await this.appointmentRepository.findRoomConflicts(roomId, startAt, endAt);

            if (roomConflicts.length > 0) {
                throw new PreconditionException('appointment.room_conflict');
            }
        }

        // 9. Compute durationMinutes and persist.
        const durationMinutes = Math.round((endAt.getTime() - startAt.getTime()) / 60_000);

        const appointment = Appointment.create({
            clinicId: actor.clinicId,
            patientId,
            attendedByMemberId,
            createdByMemberId: actor.clinicMemberId,
            startAt,
            endAt,
            durationMinutes,
            type,
            note: note ?? null,
            roomId,
        });

        await this.appointmentRepository.save(appointment);

        this.eventDispatcher.dispatch(actor, appointment);

        return new AppointmentDto(appointment);
    }

    private async resolveRoom(
        clinicId: ClinicId,
        attendedByMemberId: ClinicMemberId,
        requestedRoomId: RoomId | null
    ): Promise<RoomId | null> {
        const clinic = await this.clinicRepository.findById(clinicId);

        if (clinic === null || !clinic.roomManagementEnabled) {
            return null;
        }

        if (requestedRoomId !== null) {
            const room = await this.roomRepository.findById(requestedRoomId);

            if (room === null || !room.clinicId.equals(clinicId)) {
                throw new ResourceNotFoundException('room.not_found', requestedRoomId.toString());
            }

            return requestedRoomId;
        }

        const professional = await this.professionalRepository.findByClinicMemberId(attendedByMemberId);

        return professional?.defaultRoomId ?? null;
    }
}
