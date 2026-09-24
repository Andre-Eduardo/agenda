import {expect, test} from '@fixtures/test';
import type {ClinicMemberRole} from '@lib/factories';

const API_BASE_URL = process.env.API_URL ?? 'http://localhost:3000';

const profiles: {
    role: ClinicMemberRole;
    canManageTeam: boolean;
    canViewFinancial: boolean;
    canCreatePatient: boolean;
    canCreateRecord: boolean;
}[] = [
    {role: 'OWNER', canManageTeam: true, canViewFinancial: true, canCreatePatient: true, canCreateRecord: true},
    {role: 'ADMIN', canManageTeam: true, canViewFinancial: true, canCreatePatient: true, canCreateRecord: true},
    {role: 'PROFESSIONAL', canManageTeam: false, canViewFinancial: false, canCreatePatient: true, canCreateRecord: true},
    {role: 'SECRETARY', canManageTeam: false, canViewFinancial: false, canCreatePatient: true, canCreateRecord: false},
    {role: 'VIEWER', canManageTeam: false, canViewFinancial: false, canCreatePatient: false, canCreateRecord: false},
];

for (const profile of profiles) {
    test(`${profile.role} receives effective permissions and sees only allowed actions`, async ({
        page,
        createProfessional,
        createAuthenticatedClinicMember,
        patientListPage,
        teamListPage,
        sidebar,
    }) => {
        const clinic = await createProfessional();
        await createAuthenticatedClinicMember({clinicId: clinic.clinicId, role: profile.role});

        const permissionsResponse = await page.request.get(`${API_BASE_URL}/api/v1/clinic-members/me/permissions`);
        expect(permissionsResponse.status()).toBe(200);
        const {permissions} = (await permissionsResponse.json()) as {permissions: string[]};

        expect(permissions).toEqual([...new Set(permissions)].sort((first, second) => first.localeCompare(second)));
        expect(permissions.includes('clinic-member:create')).toBe(profile.canManageTeam);
        expect(permissions.includes('financial-report:view')).toBe(profile.canViewFinancial);
        expect(permissions.includes('patient:create')).toBe(profile.canCreatePatient);
        expect(permissions.includes('record:create')).toBe(profile.canCreateRecord);

        await patientListPage.navigate();
        await expect(patientListPage.title).toBeVisible();
        await expect(patientListPage.newPatientButton).toHaveCount(Number(profile.canCreatePatient));

        await sidebar.open();
        await expect(sidebar.link('Financeiro')).toHaveCount(Number(profile.canViewFinancial));

        await teamListPage.navigate();
        await expect(teamListPage.title).toBeVisible();
        await expect(teamListPage.addMemberButton).toHaveCount(Number(profile.canManageTeam));
    });
}

for (const role of ['PROFESSIONAL', 'SECRETARY', 'VIEWER'] as const) {
    test(`${role} cannot invite clinic members through the API`, async ({
        page,
        createProfessional,
        createAuthenticatedClinicMember,
    }) => {
        const clinic = await createProfessional();
        await createAuthenticatedClinicMember({clinicId: clinic.clinicId, role});

        const invitation = await page.request.post(`${API_BASE_URL}/api/v1/clinic-members/invite`, {data: {}});
        expect(invitation.status()).toBe(403);
    });
}
