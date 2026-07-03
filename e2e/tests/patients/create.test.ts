import {expect, test} from '@fixtures/test';

test.describe('Create patient', () => {
    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        await createAuthenticatedProfessional();
    });

    test('should create a patient with the minimum required data', async ({
        page,
        patientNewPage,
        patientListPage,
    }) => {
        const name = `Paciente E2E ${Date.now()}`;

        await patientNewPage.navigate();
        await patientNewPage.fillIdentity({name, documentId: '123.456.789-00'});
        await patientNewPage.submit();

        await expect(page).toHaveURL(/\/patients$/);
        await expect(patientListPage.row(name)).toBeVisible();
    });

    test('should show required field errors on empty submit', async ({patientNewPage}) => {
        await patientNewPage.navigate();
        await patientNewPage.attemptEmptySubmit();

        await expect(patientNewPage.nameError).toBeVisible();
        await expect(patientNewPage.documentIdError).toBeVisible();
    });

    test('should show an error for an invalid email format', async ({patientNewPage}) => {
        await patientNewPage.navigate();
        await patientNewPage.fillIdentity({name: 'Paciente Inválido', documentId: '000.000.000-00'});
        await patientNewPage.fillContact({email: 'not-an-email'});
        await patientNewPage.healthTab.click();
        await patientNewPage.submitButton.click();
        await patientNewPage.contactTab.click();

        await expect(patientNewPage.emailError).toBeVisible();
    });
});
