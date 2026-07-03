import {expect, test} from '@fixtures/test';

test.describe('Dashboard navigation', () => {
    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        await createAuthenticatedProfessional();
    });

    test('should load the dashboard page', async ({dashboardPage}) => {
        await dashboardPage.navigate();
        await dashboardPage.verifyPageLoaded();
    });

    test('should redirect the root route to the dashboard', async ({page, dashboardPage}) => {
        await page.goto('/');
        await expect(page).toHaveURL(/\/dashboard$/);
        await dashboardPage.verifyPageLoaded();
    });

    test('should match the dashboard visual snapshot', {tag: '@visual'}, async ({page, dashboardPage}) => {
        // Freeze the clock so the greeting and date text are deterministic across runs.
        await page.clock.setFixedTime(new Date('2026-03-03T09:30:00.000Z'));

        await dashboardPage.navigate();
        await dashboardPage.verifyPageLoaded();
        await dashboardPage.compareScreenshot('dashboard-page');
    });
});
