import {mock} from 'jest-mock-extended';
import {AiFormPermission, ClinicalChatPermission} from '@domain/auth/permission';
import type {ClinicLicenseRepository} from '@domain/clinic-license/clinic-license.repository';
import {ClinicLicense} from '@domain/clinic-license/entities';
import {ModuleType} from '@domain/clinic-license/models';
import {ModuleAccess} from '@domain/clinic-license/services';
import type {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMember, ClinicMemberId, ClinicMemberRole} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {UserId} from '@domain/user/entities';

function setup({isActive = true, withLicense = true} = {}) {
    const clinicId = ClinicId.generate();
    const memberId = ClinicMemberId.generate();
    const member = new ClinicMember({
        id: memberId,
        userId: UserId.generate(),
        clinicId,
        roles: [ClinicMemberRole.PROFESSIONAL],
        displayName: null,
        color: null,
        isActive,
        invitedByMemberId: null,
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        deletedAt: null,
    });
    const license = ClinicLicense.create({clinicId});

    license.enableModule(ModuleType.AI_CHAT, {includedSeats: 1, maxSeats: 1});
    license.enableModule(ModuleType.AI_FORMS, {includedSeats: 1, maxSeats: 1});
    license.assign(ModuleType.AI_FORMS, memberId, {acceptExtraCharge: false});

    const clinicLicenseRepository = mock<ClinicLicenseRepository>();
    const clinicMemberRepository = mock<ClinicMemberRepository>();

    clinicLicenseRepository.findByClinicId.mockResolvedValue(withLicense ? license : null);
    clinicMemberRepository.findById.mockResolvedValue(member);

    return {clinicId, memberId, access: new ModuleAccess(clinicLicenseRepository, clinicMemberRepository)};
}

describe('Module access', () => {
    it('answers what the clinic contracted', async () => {
        const {clinicId, access} = setup();

        await expect(access.getClinicModules(clinicId)).resolves.toEqual(
            new Set([ModuleType.AI_CHAT, ModuleType.AI_FORMS])
        );
        await expect(access.isClinicModuleEnabled(clinicId, ModuleType.AI_AGENT, ModuleType.AI_CHAT)).resolves.toBe(
            true
        );
        await expect(access.isClinicModuleEnabled(clinicId, ModuleType.AI_AGENT)).resolves.toBe(false);
    });

    it('answers what the member was assigned to', async () => {
        const {memberId, access} = setup();

        await expect(access.getClinicModulesOfMember(memberId)).resolves.toEqual(
            new Set([ModuleType.AI_CHAT, ModuleType.AI_FORMS])
        );
        await expect(access.isMemberModuleEnabled(memberId, ModuleType.AI_FORMS)).resolves.toBe(true);
        await expect(access.isMemberModuleEnabled(memberId, ModuleType.AI_CHAT)).resolves.toBe(false);

        const permissions = await access.getAllowedPermissions(memberId);

        expect(permissions.has(AiFormPermission.VIEW_CONTEXT)).toBe(true);
        expect(permissions.has(ClinicalChatPermission.CREATE)).toBe(false);
    });

    it('grants nothing to a clinic without license', async () => {
        const {clinicId, memberId, access} = setup({withLicense: false});

        await expect(access.getClinicModules(clinicId)).resolves.toEqual(new Set());
        await expect(access.getMemberModules(memberId)).resolves.toEqual(new Set());
    });

    it('grants nothing to an inactive or unknown member', async () => {
        const inactive = setup({isActive: false});

        await expect(inactive.access.getMemberModules(inactive.memberId)).resolves.toEqual(new Set());

        const clinicLicenseRepository = mock<ClinicLicenseRepository>();
        const clinicMemberRepository = mock<ClinicMemberRepository>();

        clinicMemberRepository.findById.mockResolvedValue(null);

        const access = new ModuleAccess(clinicLicenseRepository, clinicMemberRepository);

        await expect(access.getMemberModules(ClinicMemberId.generate())).resolves.toEqual(new Set());
        await expect(access.getClinicModulesOfMember(ClinicMemberId.generate())).resolves.toEqual(new Set());
    });
});
