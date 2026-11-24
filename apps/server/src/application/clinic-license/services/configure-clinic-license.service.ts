import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {ClinicLicenseDto, type ConfigureClinicLicenseDto} from '@application/clinic-license/dtos';
import {licenseOrDefault} from '@application/clinic-license/services/license-or-default';
import type {MaybeAuthenticatedActor} from '@domain/@shared/actor';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {ClinicLicenseRepository} from '@domain/clinic-license/clinic-license.repository';
import {countProfessionalSeats} from '@domain/clinic-license/services';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicRepository} from '@domain/clinic/clinic.repository';
import {EventDispatcher} from '@domain/event';

/** Contratação feita pelo SUPER_ADMIN: limites de profissionais e pacotes da clínica. */
@Injectable()
export class ConfigureClinicLicenseService implements ApplicationService<
    ConfigureClinicLicenseDto,
    ClinicLicenseDto,
    MaybeAuthenticatedActor
> {
    constructor(
        private readonly clinicRepository: ClinicRepository,
        private readonly clinicLicenseRepository: ClinicLicenseRepository,
        private readonly clinicMemberRepository: ClinicMemberRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({
        actor,
        payload,
    }: Command<ConfigureClinicLicenseDto, MaybeAuthenticatedActor>): Promise<ClinicLicenseDto> {
        const clinic = await this.clinicRepository.findById(payload.clinicId);

        if (clinic === null) throw new ResourceNotFoundException('clinic.not_found', payload.clinicId.toString());

        const license = await licenseOrDefault(this.clinicLicenseRepository, payload.clinicId);

        license.configure({
            includedProfessionals: payload.includedProfessionals,
            maxProfessionals: payload.maxProfessionals,
            modules: new Map(
                payload.modules.map((module) => [
                    module.type,
                    {includedSeats: module.includedSeats, maxSeats: module.maxSeats},
                ])
            ),
        });

        await this.clinicLicenseRepository.save(license);
        this.eventDispatcher.dispatch({...actor, clinicId: payload.clinicId}, license);

        const members = await this.clinicMemberRepository.findByClinicId(payload.clinicId);

        return new ClinicLicenseDto(license, countProfessionalSeats(members));
    }
}
