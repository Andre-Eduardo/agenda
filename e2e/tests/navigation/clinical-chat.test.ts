import {test} from '@fixtures/test';

test.describe('Clinical chat navigation', () => {
    let professionalId: string;
    let clinicId: string;

    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        const professional = await createAuthenticatedProfessional();
        professionalId = professional.id;
        clinicId = professional.clinicId;
    });

    test('should load the chat session page', async ({createPatient, chatSessionPage}) => {
        const patient = await createPatient({clinicId});

        await chatSessionPage.navigate(patient.id);
        await chatSessionPage.verifyPageLoaded();
    });

    test('should load the AI analysis page', async ({createPatient, aiAnalysisPage}) => {
        const patient = await createPatient({clinicId});

        await aiAnalysisPage.navigate(patient.id);
        await aiAnalysisPage.verifyPageLoaded();
    });
});
