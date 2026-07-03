import {expect, test} from '@fixtures/test';

test.describe('Auth guards', () => {
    test('should redirect to sign in when accessing a protected route unauthenticated', async ({
        page,
        signInPage,
    }) => {
        await page.goto('/patients');

        await signInPage.verifyPageLoaded();
        signInPage.verifyUrlParams({redirect: '/patients'});
    });

    test('should redirect to the dashboard when accessing sign in while authenticated', async ({
        page,
        createAuthenticatedProfessional,
    }) => {
        await createAuthenticatedProfessional();

        await page.goto('/auth/login');

        await expect(page).toHaveURL(/\/dashboard$/);
    });

    test('should log out and redirect back to sign in', async ({
        page,
        dashboardPage,
        sidebar,
        signInPage,
        createAuthenticatedProfessional,
    }) => {
        await createAuthenticatedProfessional();

        await dashboardPage.navigate();
        await dashboardPage.verifyPageLoaded();

        await sidebar.logout();

        await signInPage.verifyPageLoaded();
    });
});
