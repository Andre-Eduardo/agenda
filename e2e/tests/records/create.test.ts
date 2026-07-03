import {expect, test} from '@fixtures/test';

test.describe('Create clinical record', () => {
    let clinicId: string;

    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        const professional = await createAuthenticatedProfessional();
        clinicId = professional.clinicId;
    });

    test('should publish a record with a SOAP note', async ({page, createPatient, recordNewPage}) => {
        const patient = await createPatient({clinicId});

        await recordNewPage.navigate(patient.id);
        await recordNewPage.verifyPageLoaded();
        await recordNewPage.fillSoap({subjective: 'Paciente relata dor de cabeça leve há 2 dias.'});
        await recordNewPage.publish();

        await expect(page).toHaveURL(new RegExp(`/patients/${patient.id}$`));
    });

    test('should warn when publishing without any SOAP or vitals content', async ({
        page,
        createPatient,
        recordNewPage,
    }) => {
        const patient = await createPatient({clinicId});

        await recordNewPage.navigate(patient.id);
        await recordNewPage.publishButton.click();

        await expect(page.getByText(/preencha pelo menos um campo soap ou sinais vitais/i)).toBeVisible();
    });

    test('should discard changes and return to the patient detail page', async ({
        page,
        createPatient,
        recordNewPage,
    }) => {
        const patient = await createPatient({clinicId});

        await recordNewPage.navigate(patient.id);
        await recordNewPage.fillSoap({subjective: 'Rascunho a ser descartado.'});
        await recordNewPage.cancelAndDiscard();

        await expect(page).toHaveURL(new RegExp(`/patients/${patient.id}$`));
    });
});
