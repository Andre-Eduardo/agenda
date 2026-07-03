import {expect, test} from '@fixtures/test';

test.describe('Sign in page', () => {
    test('should load the sign in page', async ({signInPage}) => {
        await signInPage.navigate();
        await signInPage.verifyPageLoaded();
    });

    test('should sign in with valid credentials and redirect to the dashboard', async ({
        page,
        signInPage,
        createAuthenticatedProfessional,
    }) => {
        const professional = await createAuthenticatedProfessional({autoLogin: false});

        await signInPage.navigate();
        await signInPage.signIn(professional.user.username, professional.user.password);

        await expect(page).toHaveURL(/\/dashboard$/);
    });

    test('should show an error for invalid credentials', async ({
        signInPage,
        createAuthenticatedProfessional,
    }) => {
        const professional = await createAuthenticatedProfessional({autoLogin: false});

        await signInPage.navigate();
        await signInPage.signIn(professional.user.username, 'wrong-password');

        await signInPage.verifyInvalidCredentialsError();
    });

    test('should show required field errors on empty submit', async ({signInPage}) => {
        await signInPage.navigate();
        await signInPage.submitButton.click();

        await signInPage.verifyRequiredFieldErrors();
    });
});
