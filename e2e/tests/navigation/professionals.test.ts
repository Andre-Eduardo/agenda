import {test} from '@fixtures/test';

test.describe('Professionals navigation', () => {
    let professionalId: string;

    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        const professional = await createAuthenticatedProfessional();
        professionalId = professional.id;
    });

    test('should load the professionals list page', async ({professionalListPage}) => {
        await professionalListPage.navigate();
        await professionalListPage.verifyPageLoaded();
    });

    test('should load the new professional page', async ({professionalNewPage}) => {
        await professionalNewPage.navigate();
        await professionalNewPage.verifyPageLoaded();
    });

    test('should load the professional edit page', async ({professionalEditPage}) => {
        await professionalEditPage.navigate(professionalId);
        await professionalEditPage.verifyPageLoaded();
    });
});
