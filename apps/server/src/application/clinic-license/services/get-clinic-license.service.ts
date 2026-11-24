import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {ClinicLicenseDto} from '@application/clinic-license/dtos';
import {licenseOrDefault} from '@application/clinic-license/services/license-or-default';
import type {MaybeAuthenticatedActor} from '@domain/@shared/actor';
import {ClinicLicenseRepository} from '@domain/clinic-license/clinic-license.repository';
import {countProfessionalSeats} from '@domain/clinic-license/services';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import type {ClinicId} from '@domain/clinic/entities';

export type GetClinicLicenseDto = {clinicId: ClinicId};

@Injectable()
export class GetClinicLicenseService implements ApplicationService<
    GetClinicLicenseDto,
    ClinicLicenseDto,
    MaybeAuthenticatedActor
> {
    constructor(
        private readonly clinicLicenseRepository: ClinicLicenseRepository,
        private readonly clinicMemberRepository: ClinicMemberRepository
    ) {}

    async execute({payload}: Command<GetClinicLicenseDto, MaybeAuthenticatedActor>): Promise<ClinicLicenseDto> {
        const license = await licenseOrDefault(this.clinicLicenseRepository, payload.clinicId);
        const members = await this.clinicMemberRepository.findByClinicId(payload.clinicId);

        return new ClinicLicenseDto(license, countProfessionalSeats(members));
    }
}
