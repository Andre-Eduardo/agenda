import {Injectable} from '@nestjs/common';
import {PreconditionException, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {ClinicMemberId} from '../../../domain/clinic-member/entities';
import {WorkingHours} from '../../../domain/professional/entities';
import {WorkingHoursRepository} from '../../../domain/professional/working-hours.repository';
import {ClinicMemberRepository} from '../../../domain/clinic-member/clinic-member.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {UpsertWorkingHoursDto, WorkingHoursDto} from '../dtos';

type UpsertWorkingHoursPayload = UpsertWorkingHoursDto & {memberId: ClinicMemberId};

@Injectable()
export class UpsertWorkingHoursService implements ApplicationService<UpsertWorkingHoursPayload, WorkingHoursDto> {
    constructor(
        private readonly workingHoursRepository: WorkingHoursRepository,
        private readonly clinicMemberRepository: ClinicMemberRepository,
    ) {}

    async execute({actor, payload}: Command<UpsertWorkingHoursPayload>): Promise<WorkingHoursDto> {
        const {memberId, dayOfWeek, startTime, endTime, slotDuration, active} = payload;

        const member = await this.clinicMemberRepository.findById(memberId);

        if (member === null) {
            throw new ResourceNotFoundException('clinic_member.not_found', memberId.toString());
        }

        if (!member.clinicId.equals(actor.clinicId)) {
            throw new PreconditionException('Member does not belong to the current clinic.');
        }

        const all = await this.workingHoursRepository.findByMember(memberId);
        const existing = all.filter((wh) => wh.dayOfWeek === dayOfWeek);
        let workingHours: WorkingHours;

        if (existing.length > 0) {
            workingHours = existing[0];
            workingHours.startTime = startTime;
            workingHours.endTime = endTime;
            workingHours.slotDuration = slotDuration;
            workingHours.active = active;
        } else {
            workingHours = WorkingHours.create({
                clinicId: member.clinicId,
                clinicMemberId: memberId,
                dayOfWeek,
                startTime,
                endTime,
                slotDuration,
                active,
            });
        }

        await this.workingHoursRepository.save(workingHours);

        return new WorkingHoursDto(workingHours);
    }
}
