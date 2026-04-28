import {Injectable} from '@nestjs/common';
import {PreconditionException, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {ClinicMemberId} from '../../../domain/clinic-member/entities';
import {ClinicMemberRepository} from '../../../domain/clinic-member/clinic-member.repository';
import {MemberBlockRepository} from '../../../domain/professional/member-block.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {ListMemberBlocksDto, MemberBlockDto} from '../dtos';

type ListMemberBlocksPayload = ListMemberBlocksDto & {memberId: ClinicMemberId};

@Injectable()
export class ListMemberBlocksService
    implements ApplicationService<ListMemberBlocksPayload, MemberBlockDto[]>
{
    constructor(
        private readonly memberBlockRepository: MemberBlockRepository,
        private readonly clinicMemberRepository: ClinicMemberRepository,
    ) {}

    async execute({actor, payload}: Command<ListMemberBlocksPayload>): Promise<MemberBlockDto[]> {
        const {memberId, startAt, endAt} = payload;

        const member = await this.clinicMemberRepository.findById(memberId);

        if (member === null) {
            throw new ResourceNotFoundException('clinic_member.not_found', memberId.toString());
        }

        if (!member.clinicId.equals(actor.clinicId)) {
            throw new PreconditionException('Member does not belong to the current clinic.');
        }

        const blocks = await this.memberBlockRepository.findByMember(memberId, {startAt, endAt});

        return blocks.map((b) => new MemberBlockDto(b));
    }
}
