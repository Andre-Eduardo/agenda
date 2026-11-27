import {mock} from 'jest-mock-extended';
import {
    AiFormPermission,
    ClinicalChatPermission,
    PatientCallPermission,
    ProfessionalAgendaAccessPermission,
} from '@domain/auth/permission';
import type {ClinicLicenseRepository} from '@domain/clinic-license/clinic-license.repository';
import {ClinicLicense} from '@domain/clinic-license/entities';
import {ModuleType, OperationalModuleType} from '@domain/clinic-license/models';
import {ModuleAccess} from '@domain/clinic-license/services';
import type {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMember, ClinicMemberId, ClinicMemberRole} from '@domain/clinic-member/entities';
import type {ClinicRepository} from '@domain/clinic/clinic.repository';
import {ClinicAccountType, ClinicId} from '@domain/clinic/entities';
import {fakeClinic} from '@domain/clinic/entities/__tests__/fake-clinic';
import {UserId} from '@domain/user/entities';

function clinicRepositoryWith(accountType = ClinicAccountType.CLINIC, receptionEnabled = true) {
    const clinicRepository = mock<ClinicRepository>();

    clinicRepository.findById.mockResolvedValue(fakeClinic({accountType, receptionEnabled}));

    return clinicRepository;
}

function setup({
    isActive = true,
    withLicense = true,
    accountType = ClinicAccountType.CLINIC,
    receptionEnabled = true,
} = {}) {
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

    return {
        clinicId,
        memberId,
        access: new ModuleAccess(
            clinicLicenseRepository,
            clinicMemberRepository,
            clinicRepositoryWith(accountType, receptionEnabled)
        ),
    };
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

    it('lets a support access see every module the clinic contracted, without taking a seat', async () => {
        const clinicId = ClinicId.generate();
        const support = ClinicMember.createSupportAccess({clinicId, userId: UserId.generate(), displayName: 'Suporte'});
        const license = ClinicLicense.create({clinicId});

        license.enableModule(ModuleType.AI_CHAT, {includedSeats: 1, maxSeats: 1});

        const clinicLicenseRepository = mock<ClinicLicenseRepository>();
        const clinicMemberRepository = mock<ClinicMemberRepository>();

        clinicLicenseRepository.findByClinicId.mockResolvedValue(license);
        clinicMemberRepository.findById.mockResolvedValue(support);

        const access = new ModuleAccess(clinicLicenseRepository, clinicMemberRepository, clinicRepositoryWith());

        await expect(access.getMemberModules(support.id)).resolves.toEqual(new Set([ModuleType.AI_CHAT]));
        expect(license.membersOf(ModuleType.AI_CHAT)).toEqual([]);
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

        const access = new ModuleAccess(clinicLicenseRepository, clinicMemberRepository, clinicRepositoryWith());

        await expect(access.getMemberModules(ClinicMemberId.generate())).resolves.toEqual(new Set());
        await expect(access.getClinicModulesOfMember(ClinicMemberId.generate())).resolves.toEqual(new Set());
    });

    it('turns on the team and reception for a clinic account', async () => {
        const {clinicId, memberId, access} = setup();

        await expect(access.getOperationalModules(clinicId)).resolves.toEqual(
            new Set([OperationalModuleType.TEAM, OperationalModuleType.RECEPTION])
        );

        const permissions = await access.getAllowedPermissions(memberId);

        expect(permissions.has(ProfessionalAgendaAccessPermission.GRANT)).toBe(true);
        expect(permissions.has(PatientCallPermission.OPERATE)).toBe(true);
    });

    it('keeps a solo account without team, and with reception only when it turned it on', async () => {
        const solo = setup({accountType: ClinicAccountType.SOLO, receptionEnabled: false});

        await expect(solo.access.getOperationalModules(solo.clinicId)).resolves.toEqual(new Set());

        const permissions = await solo.access.getAllowedPermissions(solo.memberId);

        expect(permissions.has(ProfessionalAgendaAccessPermission.GRANT)).toBe(false);
        expect(permissions.has(PatientCallPermission.OPERATE)).toBe(false);

        const withReception = setup({accountType: ClinicAccountType.SOLO, receptionEnabled: true});

        await expect(withReception.access.getOperationalModulesOfMember(withReception.memberId)).resolves.toEqual(
            new Set([OperationalModuleType.RECEPTION])
        );
    });

    it('gives a solo member every contracted AI module without assignment', async () => {
        const {memberId, access} = setup({accountType: ClinicAccountType.SOLO});

        await expect(access.getMemberModules(memberId)).resolves.toEqual(
            new Set([ModuleType.AI_CHAT, ModuleType.AI_FORMS])
        );
    });

    it('has no clinic modules for an unknown clinic or inactive member', async () => {
        const clinicRepository = mock<ClinicRepository>();
        const clinicMemberRepository = mock<ClinicMemberRepository>();

        clinicRepository.findById.mockResolvedValue(null);
        clinicMemberRepository.findById.mockResolvedValue(null);

        const access = new ModuleAccess(mock<ClinicLicenseRepository>(), clinicMemberRepository, clinicRepository);

        await expect(access.getOperationalModules(ClinicId.generate())).resolves.toEqual(new Set());
        await expect(access.getOperationalModulesOfMember(ClinicMemberId.generate())).resolves.toEqual(new Set());
    });
});
