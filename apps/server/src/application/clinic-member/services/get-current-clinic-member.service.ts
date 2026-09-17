import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {ClinicMemberDto} from '@application/clinic-member/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';

@Injectable()
export class GetCurrentClinicMemberService implements ApplicationService<undefined, ClinicMemberDto> {
    constructor(private readonly clinicMemberRepository: ClinicMemberRepository) {}

    async execute({actor}: Command): Promise<ClinicMemberDto> {
        const member = await this.clinicMemberRepository.findById(actor.clinicMemberId);

        if (member === null) {
            throw new ResourceNotFoundException('clinic_member.not_found', actor.clinicMemberId.toString());
        }

        return new ClinicMemberDto(member);
    }
}
