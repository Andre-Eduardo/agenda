import {expect, test} from '@fixtures/test';

test.describe('Team — member agenda management', () => {
    let clinicId: string;
    let memberDisplayName: string;
    let clinicMemberId: string;

    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        memberDisplayName = `Dr. Titular ${Date.now()}`;
        const professional = await createAuthenticatedProfessional({displayName: memberDisplayName});
        clinicId = professional.clinicId;
        clinicMemberId = professional.clinicMemberId;
    });

    test('should list team members and open a member detail page', async ({createClinicMember, teamListPage}) => {
        const secretaryName = `Secretária ${Date.now()}`;
        await createClinicMember({clinicId, role: 'SECRETARY', displayName: secretaryName});

        await teamListPage.navigate();
        await teamListPage.verifyPageLoaded();

        await expect(teamListPage.row(memberDisplayName)).toBeVisible();
        await expect(teamListPage.row(secretaryName)).toBeVisible();

        await teamListPage.openMember(memberDisplayName);
        await expect(teamListPage.page).toHaveURL(new RegExp(`/team/${clinicMemberId}$`));
    });

    test("should configure a member's working hours from the Team detail page", async ({
        teamDetailPage,
        agendaScheduleEditor,
    }) => {
        await teamDetailPage.navigate(clinicMemberId);
        await teamDetailPage.verifyPageLoaded();

        await agendaScheduleEditor.configureDay('Terça-feira', {
            active: true,
            startTime: '09:00',
            endTime: '17:00',
            slotDuration: 20,
        });

        await expect(teamDetailPage.page.getByText('Expediente atualizado')).toBeVisible();

        await teamDetailPage.navigate(clinicMemberId);
        const row = agendaScheduleEditor.dayRow('Terça-feira');
        await expect(row.getByLabel('Início')).toHaveValue('09:00');
        await expect(row.getByLabel('Fim')).toHaveValue('17:00');
    });

    test('should grant and revoke agenda access for a secretary', async ({createClinicMember, teamDetailPage}) => {
        const secretaryName = `Secretária ${Date.now()}`;
        await createClinicMember({clinicId, role: 'SECRETARY', displayName: secretaryName});

        await teamDetailPage.navigate(clinicMemberId);
        await teamDetailPage.verifyPageLoaded();

        await teamDetailPage.grantAccessTo(secretaryName);
        await expect(teamDetailPage.page.getByText('Acesso concedido')).toBeVisible();
        await expect(teamDetailPage.granteeRow(secretaryName)).toBeVisible();

        await teamDetailPage.revokeAccessFrom(secretaryName);
        await expect(teamDetailPage.page.getByText('Acesso revogado')).toBeVisible();
        await expect(teamDetailPage.granteeRow(secretaryName)).toBeHidden();
    });
});
