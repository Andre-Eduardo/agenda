import {Injectable} from '@nestjs/common';
import type {Permission} from '@domain/auth/permission';
import {ClinicLicenseRepository} from '@domain/clinic-license/clinic-license.repository';
import {type ModuleType, permissionsFor} from '@domain/clinic-license/models';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import type {ClinicMemberId} from '@domain/clinic-member/entities';
import type {ClinicId} from '@domain/clinic/entities';

/** Responde se a clínica contratou e se o membro foi liberado para cada pacote. */
@Injectable()
export class ModuleAccess {
    constructor(
        private readonly clinicLicenseRepository: ClinicLicenseRepository,
        private readonly clinicMemberRepository: ClinicMemberRepository
    ) {}

    async getClinicModules(clinicId: ClinicId): Promise<Set<ModuleType>> {
        const license = await this.clinicLicenseRepository.findByClinicId(clinicId);

        return new Set(license?.modules.keys() ?? []);
    }

    /** Pacotes contratados pela clínica do membro, liberados para ele ou não. */
    async getClinicModulesOfMember(clinicMemberId: ClinicMemberId): Promise<Set<ModuleType>> {
        const member = await this.clinicMemberRepository.findById(clinicMemberId);

        return member === null ? new Set() : this.getClinicModules(member.clinicId);
    }

    async getMemberModules(clinicMemberId: ClinicMemberId): Promise<Set<ModuleType>> {
        const member = await this.clinicMemberRepository.findById(clinicMemberId);

        if (member === null || !member.isActive) return new Set();

        const license = await this.clinicLicenseRepository.findByClinicId(member.clinicId);

        return license?.modulesOf(clinicMemberId) ?? new Set();
    }

    /** `true` quando a clínica contratou ao menos um dos pacotes. */
    async isClinicModuleEnabled(clinicId: ClinicId, ...types: ModuleType[]): Promise<boolean> {
        const modules = await this.getClinicModules(clinicId);

        return types.some((type) => modules.has(type));
    }

    /** `true` quando o membro foi liberado em ao menos um dos pacotes. */
    async isMemberModuleEnabled(clinicMemberId: ClinicMemberId, ...types: ModuleType[]): Promise<boolean> {
        const modules = await this.getMemberModules(clinicMemberId);

        return types.some((type) => modules.has(type));
    }

    async getAllowedPermissions(clinicMemberId: ClinicMemberId): Promise<Set<Permission>> {
        return permissionsFor(await this.getMemberModules(clinicMemberId));
    }
}
