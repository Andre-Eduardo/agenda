import {test} from '@fixtures/test';

test.describe('Dashboard navigation', () => {
    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        await createAuthenticatedProfessional();
    });

    test('should load the dashboard page', async ({dashboardPage}) => {
        await dashboardPage.navigate();
        await dashboardPage.verifyPageLoaded();
    });
});
