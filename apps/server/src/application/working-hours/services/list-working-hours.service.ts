import {Injectable} from '@nestjs/common';
import {PreconditionException, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {ClinicMemberId} from '../../../domain/clinic-member/entities';
import {WorkingHoursRepository} from '../../../domain/professional/working-hours.repository';
import {ClinicMemberRepository} from '../../../domain/clinic-member/clinic-member.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {WorkingHoursDto} from '../dtos';

type ListWorkingHoursPayload = {memberId: ClinicMemberId};

@Injectable()
export class ListWorkingHoursService implements ApplicationService<ListWorkingHoursPayload, WorkingHoursDto[]> {
    constructor(
        private readonly workingHoursRepository: WorkingHoursRepository,
        private readonly clinicMemberRepository: ClinicMemberRepository,
    ) {}

    async execute({actor, payload}: Command<ListWorkingHoursPayload>): Promise<WorkingHoursDto[]> {
        const {memberId} = payload;

        const member = await this.clinicMemberRepository.findById(memberId);
        if (member === null) {
            throw new ResourceNotFoundException('clinic_member.not_found', memberId.toString());
        }
        if (!member.clinicId.equals(actor.clinicId)) {
            throw new PreconditionException('Member does not belong to the current clinic.');
        }

        const records = await this.workingHoursRepository.findByMember(memberId);

        return records.map((wh) => new WorkingHoursDto(wh));
    }
}
