import {Injectable} from '@nestjs/common';
import {PreconditionException, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {ClinicMemberId} from '../../../domain/clinic-member/entities';
import {ClinicMemberRepository} from '../../../domain/clinic-member/clinic-member.repository';
import {MemberBlock} from '../../../domain/professional/entities';
import {MemberBlockRepository} from '../../../domain/professional/member-block.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CreateMemberBlockDto, MemberBlockDto} from '../dtos';

type CreateMemberBlockPayload = CreateMemberBlockDto & {memberId: ClinicMemberId};

@Injectable()
export class CreateMemberBlockService
    implements ApplicationService<CreateMemberBlockPayload, MemberBlockDto>
{
    constructor(
        private readonly memberBlockRepository: MemberBlockRepository,
        private readonly clinicMemberRepository: ClinicMemberRepository,
    ) {}

    async execute({actor, payload}: Command<CreateMemberBlockPayload>): Promise<MemberBlockDto> {
        const {memberId, startAt, endAt, reason} = payload;

        const member = await this.clinicMemberRepository.findById(memberId);
        if (member === null) {
            throw new ResourceNotFoundException('clinic_member.not_found', memberId.toString());
        }
        if (!member.clinicId.equals(actor.clinicId)) {
            throw new PreconditionException('Member does not belong to the current clinic.');
        }

        const block = MemberBlock.create({
            clinicMemberId: memberId,
            startAt,
            endAt,
            reason: reason ?? null,
        });

        await this.memberBlockRepository.save(block);

        return new MemberBlockDto(block);
    }
}
