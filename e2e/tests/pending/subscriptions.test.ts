import {test} from '@fixtures/test';

// "Planos e Assinaturas" module from mvp-features.html: plan catalog, add-ons and the Asaas
// payment gateway are all backend/config-only — apps/web has no billing or plan-management
// screen for a professional or clinic owner.

test.describe('Catálogo de planos e assinatura do profissional', () => {
    // Feature not implemented in the frontend: PLAN_LIMITS + PlanCode define 4 static plans
    // (Starter R$49, Consultório R$89, Clínica R$149, Especialista R$229) and
    // ProfessionalSubscription tracks status/period/previousPlanCode, but there is no
    // "Planos" screen to view the current plan or change it.
    //
    // test('should let a professional view their current plan and upgrade to a higher tier', async ({
    //     createAuthenticatedProfessional,
    //     page,
    // }) => {
    //     await createAuthenticatedProfessional();
    //     await page.goto('/settings/billing/plan');
    //     await expect(page.getByText(/plano atual: starter/i)).toBeVisible();
    //     await page.getByRole('button', {name: /mudar para clínica/i}).click();
    //     await expect(page.getByText(/plano atualizado para clínica/i)).toBeVisible();
    // });
});

test.describe('Add-ons e pacotes extras', () => {
    // Feature not implemented in the frontend: ADDON_CATALOG and SubscriptionAddon (per
    // month, with quantity) feed getEffectiveLimits(), but there is no UI to browse or
    // purchase an add-on.
    //
    // test('should let a professional purchase an extra add-on package', async ({
    //     createAuthenticatedProfessional,
    //     page,
    // }) => {
    //     await createAuthenticatedProfessional();
    //     await page.goto('/settings/billing/addons');
    //     await page.getByRole('button', {name: /comprar/i}).first().click();
    //     await expect(page.getByText(/add-on ativo/i)).toBeVisible();
    // });
});

test.describe('Gateway de pagamento — cobrança recorrente (Asaas)', () => {
    // Feature not implemented in the frontend: AsaasPaymentAdapter and the
    // POST /webhooks/asaas endpoint handle confirmed/failed/overdue payment events
    // server-side, but there is no billing status indicator (e.g. "pagamento em atraso")
    // surfaced anywhere in the app for the professional to see or act on.
    //
    // test('should show an overdue payment banner after an Asaas webhook reports a failed charge', async ({
    //     createAuthenticatedProfessional,
    //     dashboardPage,
    //     page,
    // }) => {
    //     await createAuthenticatedProfessional();
    //     // simulate POST /webhooks/asaas with a PAYMENT_OVERDUE event for this clinic
    //     await dashboardPage.navigate();
    //     await expect(page.getByText(/pagamento em atraso/i)).toBeVisible();
    // });
});
