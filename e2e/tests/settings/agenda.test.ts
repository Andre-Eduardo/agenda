import {expect, test} from '@fixtures/test';

test.describe('Agenda settings (working hours + member blocks)', () => {
    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        await createAuthenticatedProfessional();
    });

    test('should configure and persist a weekday working-hours schedule', async ({settingsPage, agendaScheduleEditor}) => {
        await settingsPage.navigate();
        await settingsPage.goToAgendaSection();

        await agendaScheduleEditor.configureDay('Segunda-feira', {
            active: true,
            startTime: '08:00',
            endTime: '18:00',
            slotDuration: 45,
        });

        await expect(settingsPage.page.getByText('Expediente atualizado')).toBeVisible();

        await settingsPage.navigate();
        await settingsPage.goToAgendaSection();

        const row = agendaScheduleEditor.dayRow('Segunda-feira');
        await expect(row.getByLabel('Início')).toHaveValue('08:00');
        await expect(row.getByLabel('Fim')).toHaveValue('18:00');
        await expect(row.getByLabel(/duração do atendimento/i)).toHaveValue('45');
    });

    test('should create and delete a member block', async ({settingsPage, agendaScheduleEditor}) => {
        const reason = `Férias ${Date.now()}`;

        await settingsPage.navigate();
        await settingsPage.goToAgendaSection();

        await agendaScheduleEditor.createBlock({
            start: '2027-01-05T09:00',
            end: '2027-01-10T18:00',
            reason,
        });

        await expect(settingsPage.page.getByText('Bloqueio criado')).toBeVisible();
        await expect(agendaScheduleEditor.blockText(reason)).toBeVisible();

        await agendaScheduleEditor.deleteBlock(reason);

        await expect(settingsPage.page.getByText('Bloqueio removido')).toBeVisible();
        await expect(agendaScheduleEditor.blockText(reason)).toBeHidden();
    });
});
