import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {AppointmentDto, UpdateAppointmentDto} from '@application/appointment/dtos';
import {AgendaAccessChecker} from '@application/professional-agenda-access/services';
import {InvalidInputException, PreconditionException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {Transactional} from '@domain/@shared/repository';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {UpdateAppointment} from '@domain/appointment/entities';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicRepository} from '@domain/clinic/clinic.repository';
import {ClinicId} from '@domain/clinic/entities';
import {EventDispatcher} from '@domain/event';
import {MemberBlockRepository} from '@domain/professional/member-block.repository';
import {WorkingHoursRepository} from '@domain/professional/working-hours.repository';
import {RoomId} from '@domain/room/entities';
import {RoomRepository} from '@domain/room/room.repository';

@Injectable()
export class UpdateAppointmentService implements ApplicationService<UpdateAppointmentDto, AppointmentDto> {
    constructor(
        private readonly appointmentRepository: AppointmentRepository,
        private readonly clinicMemberRepository: ClinicMemberRepository,
        private readonly clinicRepository: ClinicRepository,
        private readonly roomRepository: RoomRepository,
        private readonly workingHoursRepository: WorkingHoursRepository,
        private readonly memberBlockRepository: MemberBlockRepository,
        private readonly agendaAccessChecker: AgendaAccessChecker,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    @Transactional()
    async execute({actor, payload: {id, ...props}}: Command<UpdateAppointmentDto>): Promise<AppointmentDto> {
        const appointment = await this.appointmentRepository.findById(id);

        if (appointment === null) {
            throw new ResourceNotFoundException('Appointment not found.', id.toString());
        }

        const rescheduling = props.startAt !== undefined || props.endAt !== undefined;
        const changingProfessional = props.attendedByMemberId !== undefined;
        const changingRoom = props.roomId !== undefined;

        const changeProps: UpdateAppointment = {
            type: props.type,
            note: props.note === undefined ? undefined : props.note,
        };

        const attendedByMemberId = await this.resolveAttendedByMember(
            actor.clinicId,
            appointment.attendedByMemberId,
            props.attendedByMemberId
        );

        if (changingProfessional) {
            await this.agendaAccessChecker.assertCanManage(actor, attendedByMemberId);
            changeProps.attendedByMemberId = attendedByMemberId;
        }

        if (rescheduling || changingProfessional) {
            const startAt = props.startAt ?? appointment.startAt;
            const endAt = props.endAt ?? appointment.endAt;

            if (startAt >= endAt) {
                throw new InvalidInputException('endAt must be after startAt', [
                    {field: 'endAt', reason: 'endAt must be after startAt'},
                ]);
            }

            // Working hours — advisory only, see CreateAppointmentService for the rationale.
            const dayOfWeek = startAt.getDay();
            const workingHours = await this.workingHoursRepository.findByMemberAndDay(attendedByMemberId, dayOfWeek);

            if (workingHours.length > 0) {
                const coversInterval = workingHours.some((wh) => wh.coversInterval(startAt, endAt));

                if (!coversInterval && !props.confirmOutsideAvailability) {
                    throw new PreconditionException('appointment.outside_working_hours');
                }
            }

            // Member blocks — advisory only.
            const blocks = await this.memberBlockRepository.findOverlapping(attendedByMemberId, startAt, endAt);

            if (blocks.length > 0 && !props.confirmOutsideAvailability) {
                throw new PreconditionException('appointment.member_block');
            }

            // Lock both schedules in a stable order when moving a consultation between
            // professionals. This keeps swaps race-free without introducing a lock-order deadlock.
            const memberIdsToLock = Array.from(
                new Map(
                    [appointment.attendedByMemberId, attendedByMemberId].map((memberId) => [
                        memberId.toString(),
                        memberId,
                    ])
                ).values()
            ).toSorted((a, b) => a.toString().localeCompare(b.toString()));

            for (const memberId of memberIdsToLock) {
                await this.appointmentRepository.lockMemberSchedule(memberId);
            }

            const conflicts = await this.appointmentRepository.findConflicts(attendedByMemberId, startAt, endAt, id);

            if (conflicts.length > 0) {
                throw new PreconditionException('There is a scheduling conflict with an existing appointment.');
            }

            changeProps.startAt = startAt;
            changeProps.endAt = endAt;
            changeProps.durationMinutes = Math.round((endAt.getTime() - startAt.getTime()) / 60_000);
        }

        if (rescheduling || changingRoom) {
            const startAt = changeProps.startAt ?? appointment.startAt;
            const endAt = changeProps.endAt ?? appointment.endAt;
            const requestedRoomId = changingRoom ? (props.roomId ?? null) : appointment.roomId;

            const roomId = await this.resolveRoom(actor.clinicId, requestedRoomId);

            if (roomId !== null) {
                await this.appointmentRepository.lockRoomSchedule(roomId);

                const roomConflicts = await this.appointmentRepository.findRoomConflicts(roomId, startAt, endAt, id);

                if (roomConflicts.length > 0) {
                    throw new PreconditionException('appointment.room_conflict');
                }
            }

            changeProps.roomId = roomId;
        }

        appointment.change(changeProps);

        await this.appointmentRepository.save(appointment);

        this.eventDispatcher.dispatch(actor, appointment);

        return new AppointmentDto(appointment);
    }

    private async resolveAttendedByMember(
        clinicId: ClinicId,
        currentMemberId: ClinicMemberId,
        requestedMemberId: ClinicMemberId | undefined
    ): Promise<ClinicMemberId> {
        if (requestedMemberId === undefined) {
            return currentMemberId;
        }

        const member = await this.clinicMemberRepository.findById(requestedMemberId);

        if (member === null) {
            throw new ResourceNotFoundException('clinic_member.not_found', requestedMemberId.toString());
        }

        if (!member.clinicId.equals(clinicId)) {
            throw new PreconditionException('Member does not belong to the current clinic.');
        }

        return requestedMemberId;
    }

    private async resolveRoom(clinicId: ClinicId, requestedRoomId: RoomId | null): Promise<RoomId | null> {
        const clinic = await this.clinicRepository.findById(clinicId);

        if (clinic === null || !clinic.roomManagementEnabled) {
            return null;
        }

        if (requestedRoomId === null) {
            return null;
        }

        const room = await this.roomRepository.findById(requestedRoomId);

        if (room === null || !room.clinicId.equals(clinicId)) {
            throw new ResourceNotFoundException('room.not_found', requestedRoomId.toString());
        }

        return requestedRoomId;
    }
}
