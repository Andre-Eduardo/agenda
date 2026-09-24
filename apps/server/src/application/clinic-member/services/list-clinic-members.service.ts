import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {ClinicMemberDto} from '@application/clinic-member/dtos';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicId} from '@domain/clinic/entities';

export type ListClinicMembersInput = {clinicId: ClinicId};

@Injectable()
export class ListClinicMembersService implements ApplicationService<ListClinicMembersInput, ClinicMemberDto[]> {
    constructor(private readonly clinicMemberRepository: ClinicMemberRepository) {}

    async execute({actor, payload}: Command<ListClinicMembersInput>): Promise<ClinicMemberDto[]> {
        assertEntityBelongsToClinic(payload.clinicId, actor.clinicId);
        const members = await this.clinicMemberRepository.findByClinicId(payload.clinicId);

        return members.map((m) => new ClinicMemberDto(m));
    }
}
