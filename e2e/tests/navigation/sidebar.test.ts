import {expect, test} from '@fixtures/test';

const destinations = [
    {name: 'Dashboard', path: '/dashboard'},
    {name: 'Consultas', path: '/appointments'},
    {name: 'Pacientes', path: '/patients'},
    {name: 'Profissionais', path: '/professionals'},
    {name: 'Equipe', path: '/team'},
    {name: 'Configurações', path: '/settings'},
] as const;

test.describe('Sidebar navigation', () => {
    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        await createAuthenticatedProfessional();
    });

    test('should open every visible destination without rendering the not-found page', async ({page, sidebar}) => {
        await page.goto('/dashboard');

        for (const destination of destinations) {
            await test.step(destination.name, async () => {
                await sidebar.navigateTo(destination.name);

                await expect(page).toHaveURL(new RegExp(`${destination.path}$`));
                await expect(page.getByText('Página não encontrada', {exact: true})).toHaveCount(0);
            });
        }
    });

    test('should hide the financial destination from a professional, who lacks financial-report:view', async ({
        page,
        sidebar,
    }) => {
        const permissionsLoaded = page.waitForResponse(
            (response) => response.url().includes('/api/v1/clinic-members/me/permissions') && response.ok()
        );

        await page.goto('/dashboard');
        await permissionsLoaded;

        await sidebar.open();

        await expect(sidebar.link('Configurações')).toBeVisible();
        await expect(sidebar.link('Financeiro')).toHaveCount(0);
    });
});
