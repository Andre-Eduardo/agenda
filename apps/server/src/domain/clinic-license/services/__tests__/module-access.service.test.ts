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

        expect(await access.getClinicModules(clinicId)).toEqual(new Set([ModuleType.AI_CHAT, ModuleType.AI_FORMS]));
        expect(await access.isClinicModuleEnabled(clinicId, ModuleType.AI_AGENT, ModuleType.AI_CHAT)).toBe(true);
        expect(await access.isClinicModuleEnabled(clinicId, ModuleType.AI_AGENT)).toBe(false);
    });

    it('answers what the member was assigned to', async () => {
        const {memberId, access} = setup();

        expect(await access.getClinicModulesOfMember(memberId)).toEqual(
            new Set([ModuleType.AI_CHAT, ModuleType.AI_FORMS])
        );
        expect(await access.isMemberModuleEnabled(memberId, ModuleType.AI_FORMS)).toBe(true);
        expect(await access.isMemberModuleEnabled(memberId, ModuleType.AI_CHAT)).toBe(false);

        const permissions = await access.getAllowedPermissions(memberId);

        expect(permissions.has(AiFormPermission.VIEW_CONTEXT)).toBe(true);
        expect(permissions.has(ClinicalChatPermission.CREATE)).toBe(false);
    });

    it('grants nothing to a clinic without license', async () => {
        const {clinicId, memberId, access} = setup({withLicense: false});

        expect(await access.getClinicModules(clinicId)).toEqual(new Set());
        expect(await access.getMemberModules(memberId)).toEqual(new Set());
    });

    it('grants nothing to an inactive or unknown member', async () => {
        const inactive = setup({isActive: false});

        expect(await inactive.access.getMemberModules(inactive.memberId)).toEqual(new Set());

        const clinicLicenseRepository = mock<ClinicLicenseRepository>();
        const clinicMemberRepository = mock<ClinicMemberRepository>();

        clinicMemberRepository.findById.mockResolvedValue(null);

        const access = new ModuleAccess(clinicLicenseRepository, clinicMemberRepository);

        expect(await access.getMemberModules(ClinicMemberId.generate())).toEqual(new Set());
        expect(await access.getClinicModulesOfMember(ClinicMemberId.generate())).toEqual(new Set());
    });
});
