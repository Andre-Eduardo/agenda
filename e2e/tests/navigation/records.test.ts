import {test} from '@fixtures/test';

test.describe('Records navigation', () => {
    let professionalId: string;

    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        const professional = await createAuthenticatedProfessional();
        professionalId = professional.id;
    });

    test('should load the new record page', async ({createPatient, recordNewPage}) => {
        const patient = await createPatient({professionalId});

        await recordNewPage.navigate(patient.id);
        await recordNewPage.verifyPageLoaded();
    });
});
