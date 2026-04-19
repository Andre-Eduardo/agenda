import {test} from '@fixtures/test';

test.describe('Sign in page', () => {
    test('should load the sign in page', async ({signInPage}) => {
        await signInPage.navigate();
        await signInPage.verifyPageLoaded();
    });
});
