import {test} from '@fixtures/test';

test.describe('Appointments navigation', () => {
    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        await createAuthenticatedProfessional();
    });

    test('should load the appointments list page', async ({appointmentListPage}) => {
        await appointmentListPage.navigate();
        await appointmentListPage.verifyPageLoaded();
    });
});
