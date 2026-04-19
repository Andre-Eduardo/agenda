import {test} from '@fixtures/test';

test.describe('Clinical chat navigation', () => {
    let professionalId: string;

    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        const professional = await createAuthenticatedProfessional();
        professionalId = professional.id;
    });

    test('should load the chat session page', async ({createPatient, chatSessionPage}) => {
        const patient = await createPatient({professionalId});

        await chatSessionPage.navigate(patient.id);
        await chatSessionPage.verifyPageLoaded();
    });

    test('should load the AI analysis page', async ({createPatient, aiAnalysisPage}) => {
        const patient = await createPatient({professionalId});

        await aiAnalysisPage.navigate(patient.id);
        await aiAnalysisPage.verifyPageLoaded();
    });
});
