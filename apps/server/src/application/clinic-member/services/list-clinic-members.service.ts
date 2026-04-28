import {Injectable} from '@nestjs/common';
import {ClinicId} from '../../../domain/clinic/entities';
import {ClinicMemberRepository} from '../../../domain/clinic-member/clinic-member.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {ClinicMemberDto} from '../dtos';

export type ListClinicMembersInput = {clinicId: ClinicId};

@Injectable()
export class ListClinicMembersService implements ApplicationService<ListClinicMembersInput, ClinicMemberDto[]> {
    constructor(private readonly clinicMemberRepository: ClinicMemberRepository) {}

    async execute({payload}: Command<ListClinicMembersInput>): Promise<ClinicMemberDto[]> {
        const members = await this.clinicMemberRepository.findByClinicId(payload.clinicId);

        return members.map((m) => new ClinicMemberDto(m));
    }
}
