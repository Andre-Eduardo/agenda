import {expect, test} from '@fixtures/test';

test.describe('Reminder settings', () => {
    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        // clinic-reminder-config:manage is granted to OWNER/ADMIN only.
        await createAuthenticatedProfessional({additionalRoles: ['OWNER']});
    });

    test('should configure channels, lead times and text, with a live preview', async ({settingsPage}) => {
        const template = 'Oi {{paciente}}, sua consulta é {{data}} às {{hora}}.';

        await settingsPage.navigate();
        await settingsPage.goToLembretesSection();

        await settingsPage.configureReminders({
            channels: ['WhatsApp', 'E-mail'],
            leadTimes: ['24', '2'],
            template,
        });

        await expect(settingsPage.reminderPreview).toContainText('Oi Maria Silva, sua consulta é');

        await settingsPage.saveReminders();
        await expect(settingsPage.page.getByText(/lembretes salvos/i)).toBeVisible();

        await settingsPage.navigate();
        await settingsPage.goToLembretesSection();

        await expect(settingsPage.reminderTemplate).toHaveValue(template);
        await expect(settingsPage.page.getByRole('checkbox', {name: 'E-mail'})).toBeChecked();
        await expect(settingsPage.page.getByLabel('Antecedência 2, em horas')).toHaveValue('2');
    });

    test('should block saving a text with an unknown variable', async ({settingsPage}) => {
        await settingsPage.navigate();
        await settingsPage.goToLembretesSection();

        await settingsPage.reminderTemplate.fill('Oi {{nome}}');
        await settingsPage.saveReminders();

        await expect(settingsPage.page.getByText('Variável desconhecida: {{nome}}.')).toBeVisible();
        await expect(settingsPage.page.getByText(/lembretes salvos/i)).toBeHidden();
    });
});
