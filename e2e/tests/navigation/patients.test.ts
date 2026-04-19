import {test} from '@fixtures/test';

test.describe('Patients navigation', () => {
    let professionalId: string;

    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        const professional = await createAuthenticatedProfessional();
        professionalId = professional.id;
    });

    test('should load the patients list page', async ({patientListPage}) => {
        await patientListPage.navigate();
        await patientListPage.verifyPageLoaded();
    });

    test('should load the new patient page', async ({patientNewPage}) => {
        await patientNewPage.navigate();
        await patientNewPage.verifyPageLoaded();
    });

    test('should load the patient detail page', async ({createPatient, patientDetailPage}) => {
        const patient = await createPatient({professionalId});

        await patientDetailPage.navigate(patient.id);
        await patientDetailPage.verifyPageLoaded(patient.name);
    });

    test('should load the patient edit page', async ({createPatient, patientEditPage}) => {
        const patient = await createPatient({professionalId});

        await patientEditPage.navigate(patient.id);
        await patientEditPage.verifyPageLoaded();
    });
});
