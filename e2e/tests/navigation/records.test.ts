import {test} from '@fixtures/test';

test.describe('Records navigation', () => {
    let professionalId: string;
    let clinicId: string;

    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        const professional = await createAuthenticatedProfessional();
        professionalId = professional.id;
        clinicId = professional.clinicId;
    });

    test('should load the new record page', async ({createPatient, recordNewPage}) => {
        const patient = await createPatient({clinicId});

        await recordNewPage.navigate(patient.id);
        await recordNewPage.verifyPageLoaded();
    });
});
