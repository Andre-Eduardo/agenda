import {test} from '@fixtures/test';

test.describe('Form templates navigation', () => {
    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        await createAuthenticatedProfessional();
    });

    test('should load the form templates list page', async ({formTemplateListPage}) => {
        await formTemplateListPage.navigate();
        await formTemplateListPage.verifyPageLoaded();
    });
});
