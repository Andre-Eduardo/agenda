import {Injectable} from '@nestjs/common';
import type {Permission} from '@domain/auth/permission';
import {ClinicLicenseRepository} from '@domain/clinic-license/clinic-license.repository';
import {
    type ModuleType,
    type OperationalModuleType,
    operationalModulesOf,
    permissionsFor,
} from '@domain/clinic-license/models';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import type {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicRepository} from '@domain/clinic/clinic.repository';
import type {ClinicId} from '@domain/clinic/entities';

/**
 * Responde se a clínica contratou e se o membro foi liberado para cada pacote de IA,
 * e quais módulos de clínica (equipe, recepção) a conta tem.
 */
@Injectable()
export class ModuleAccess {
    constructor(
        private readonly clinicLicenseRepository: ClinicLicenseRepository,
        private readonly clinicMemberRepository: ClinicMemberRepository,
        private readonly clinicRepository: ClinicRepository
    ) {}

    /** Módulos de clínica ligados pelo tipo de conta e pelas configurações da clínica. */
    async getOperationalModules(clinicId: ClinicId): Promise<Set<OperationalModuleType>> {
        const clinic = await this.clinicRepository.findById(clinicId);

        return clinic === null ? new Set() : operationalModulesOf(clinic);
    }

    /** Módulos de clínica da clínica do membro (o suporte vê os da clínica que avalia). */
    async getOperationalModulesOfMember(clinicMemberId: ClinicMemberId): Promise<Set<OperationalModuleType>> {
        const member = await this.clinicMemberRepository.findById(clinicMemberId);

        if (member === null || !member.isActive) return new Set();

        return this.getOperationalModules(member.clinicId);
    }

    async getClinicModules(clinicId: ClinicId): Promise<Set<ModuleType>> {
        const license = await this.clinicLicenseRepository.findByClinicId(clinicId);

        return new Set(license?.modules.keys());
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

        // O suporte avalia a clínica como ela foi contratada: vê os pacotes dela, sem ocupar vaga.
        if (member.supportAccess) return new Set(license?.modules.keys());

        // Conta SOLO tem um membro só: o pacote contratado vale direto para ele, sem liberação.
        const clinic = await this.clinicRepository.findById(member.clinicId);

        if (clinic?.isSolo() === true) return new Set(license?.modules.keys());

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
        return permissionsFor(
            await this.getMemberModules(clinicMemberId),
            await this.getOperationalModulesOfMember(clinicMemberId)
        );
    }
}
