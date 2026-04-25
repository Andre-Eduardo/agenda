import {Injectable} from '@nestjs/common';
import {PreconditionException, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {ClinicMemberId} from '../../../domain/clinic-member/entities';
import {ClinicMemberRepository} from '../../../domain/clinic-member/clinic-member.repository';
import {MemberBlockId} from '../../../domain/professional/entities';
import {MemberBlockRepository} from '../../../domain/professional/member-block.repository';
import {ApplicationService, Command} from '../../@shared/application.service';

type DeleteMemberBlockPayload = {memberId: ClinicMemberId; blockId: MemberBlockId};

@Injectable()
export class DeleteMemberBlockService implements ApplicationService<DeleteMemberBlockPayload, void> {
    constructor(
        private readonly memberBlockRepository: MemberBlockRepository,
        private readonly clinicMemberRepository: ClinicMemberRepository,
    ) {}

    async execute({actor, payload}: Command<DeleteMemberBlockPayload>): Promise<void> {
        const {memberId, blockId} = payload;

        const member = await this.clinicMemberRepository.findById(memberId);
        if (member === null) {
            throw new ResourceNotFoundException('clinic_member.not_found', memberId.toString());
        }
        if (!member.clinicId.equals(actor.clinicId)) {
            throw new PreconditionException('Member does not belong to the current clinic.');
        }

        const block = await this.memberBlockRepository.findById(blockId);
        if (block === null) {
            throw new ResourceNotFoundException('member_block.not_found', blockId.toString());
        }
        if (!block.clinicMemberId.equals(memberId)) {
            throw new PreconditionException('Block does not belong to the specified member.');
        }

        await this.memberBlockRepository.delete(blockId);
    }
}
