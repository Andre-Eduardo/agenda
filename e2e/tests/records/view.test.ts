import {test} from '@fixtures/test';

test.describe('View clinical record', () => {
    let clinicId: string;

    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        const professional = await createAuthenticatedProfessional();
        clinicId = professional.clinicId;
    });

    test('should open a published record from the patient detail page', async ({
        createPatient,
        recordNewPage,
        patientDetailPage,
        recordDetailPage,
    }) => {
        const patient = await createPatient({clinicId});
        const subjective = 'Paciente relata melhora significativa dos sintomas.';

        await recordNewPage.navigate(patient.id);
        await recordNewPage.fillSoap({subjective});
        await recordNewPage.publish();

        await patientDetailPage.verifyPageLoaded(patient.name);
        await patientDetailPage.openFirstRecord();

        await recordDetailPage.verifyPageLoaded();
        await recordDetailPage.verifyContent(subjective);
    });
});
