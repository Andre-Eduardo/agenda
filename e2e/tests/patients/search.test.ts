import {expect, test} from '@fixtures/test';

test.describe('Patient list search', () => {
    let clinicId: string;

    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        const professional = await createAuthenticatedProfessional();
        clinicId = professional.clinicId;
    });

    test('should filter the patient list down to names matching the search term', async ({
        createPatient,
        patientListPage,
    }) => {
        const suffix = Date.now();
        const match = await createPatient({clinicId, name: `Busca Alvo ${suffix}`});
        const other = await createPatient({clinicId, name: `Paciente Distinto ${suffix}`});

        await patientListPage.navigate();
        await expect(patientListPage.row(match.name)).toBeVisible();
        await expect(patientListPage.row(other.name)).toBeVisible();

        await patientListPage.search('Busca Alvo');

        await expect(patientListPage.row(match.name)).toBeVisible();
        await expect(patientListPage.row(other.name)).toBeHidden();
    });
});
