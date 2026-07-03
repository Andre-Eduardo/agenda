import {expect, test} from '@fixtures/test';

test.describe('View patients', () => {
    let clinicId: string;

    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        const professional = await createAuthenticatedProfessional();
        clinicId = professional.clinicId;
    });

    test('should find a patient by name search', async ({createPatient, patientListPage}) => {
        const patient = await createPatient({clinicId});

        await patientListPage.navigate();
        await patientListPage.search(patient.name);

        await expect(patientListPage.row(patient.name)).toBeVisible();
    });

    test('should show an empty state when the search has no results', async ({patientListPage}) => {
        await patientListPage.navigate();
        await patientListPage.search('no-such-patient-xyz');

        await expect(patientListPage.emptyState).toBeVisible();
    });

    test('should open the patient detail page from the list', async ({createPatient, patientListPage, patientDetailPage}) => {
        const patient = await createPatient({clinicId});

        await patientListPage.navigate();
        await patientListPage.search(patient.name);
        await patientListPage.openPatient(patient.name);

        await patientDetailPage.verifyPageLoaded(patient.name);
    });

    test('should match the patient list visual snapshot', {tag: '@visual'}, async ({createPatient, patientListPage}) => {
        // Deterministic name/document (no random suffix, no birthDate) so the baseline stays stable across runs.
        await createPatient({clinicId, name: 'Visual QA Patient', documentId: '000.000.000-00'});

        await patientListPage.navigate();
        await patientListPage.verifyPageLoaded();
        await patientListPage.compareScreenshot('patient-list-page');
    });
});
