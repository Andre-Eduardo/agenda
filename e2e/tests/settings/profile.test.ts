import {expect, test} from '@fixtures/test';

test.describe('Profile settings', () => {
    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        await createAuthenticatedProfessional();
    });

    test('should load the settings page with the identity tab active', async ({settingsPage}) => {
        await settingsPage.navigate();
        await settingsPage.verifyPageLoaded();
    });

    test('should navigate between profile tabs', async ({settingsPage}) => {
        await settingsPage.navigate();

        await settingsPage.professionalTab.click();
        await expect(settingsPage.registryNumberInput).toBeVisible();

        await settingsPage.officeTab.click();
        await expect(settingsPage.registryNumberInput).toBeHidden();

        await settingsPage.securityTab.click();
        await expect(settingsPage.saveButton).toBeVisible();
    });

    test('should update the professional registration number', async ({page, settingsPage}) => {
        await settingsPage.navigate();
        await settingsPage.updateRegistryNumber('123456');

        await expect(page.getByText(/perfil atualizado/i)).toBeVisible();
    });
});

test.describe('Profile settings visual', () => {
    test(
        'should match the profile identity tab visual snapshot',
        {tag: '@visual'},
        async ({createAuthenticatedProfessional, settingsPage}) => {
            // Deterministic name/email (no random suffix) so the baseline stays stable across runs.
            await createAuthenticatedProfessional({
                user: {name: 'Visual QA User', email: 'visual-qa@example.com'},
            });

            await settingsPage.navigate();
            await settingsPage.verifyPageLoaded();
            await settingsPage.compareScreenshot('settings-identity-tab');
        }
    );
});
