import {expect, test} from '@fixtures/test';

test.describe('Update patient', () => {
    let clinicId: string;

    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        const professional = await createAuthenticatedProfessional();
        clinicId = professional.clinicId;
    });

    test('should update a patient and reflect the change on the detail page', async ({
        page,
        createPatient,
        patientEditPage,
        patientDetailPage,
    }) => {
        const patient = await createPatient({clinicId});
        const updatedName = `${patient.name} (atualizado)`;

        await patientEditPage.navigate(patient.id);
        await patientEditPage.verifyPageLoaded();
        await patientEditPage.fillIdentity({name: updatedName});
        await patientEditPage.submit();

        await expect(page).toHaveURL(new RegExp(`/patients/${patient.id}$`));
        await patientDetailPage.verifyPageLoaded(updatedName);
    });

    test('should show a required error when clearing the name field', async ({createPatient, patientEditPage}) => {
        const patient = await createPatient({clinicId});

        await patientEditPage.navigate(patient.id);
        await patientEditPage.fillIdentity({name: ''});
        await patientEditPage.healthTab.click();
        await patientEditPage.submitButton.click();
        await patientEditPage.identityTab.click();

        await expect(patientEditPage.nameError).toBeVisible();
    });
});
