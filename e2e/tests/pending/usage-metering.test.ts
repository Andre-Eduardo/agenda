import {test} from '@fixtures/test';

// "Metering e Uso" module from mvp-features.html: usage counting and limit enforcement run
// entirely server-side (UsageLimitGuard, X-RateLimit-* headers) with no visible UI —
// professionals have no way to see their consumption or an approaching limit today.

test.describe('Endpoint de consumo atual do profissional', () => {
    // Feature not implemented in the frontend: GET /members/:id/usage returns per-metric
    // status (OK/WARNING/EXCEEDED/NOT_INCLUDED), but there is no usage dashboard consuming
    // it — a professional cannot see how much of their plan they've used this month.
    //
    // test('should show the professional their current usage against plan limits', async ({
    //     createAuthenticatedProfessional,
    //     page,
    // }) => {
    //     await createAuthenticatedProfessional();
    //     await page.goto('/settings/usage');
    //     await expect(page.getByText(/uso do plano/i)).toBeVisible();
    // });
});

test.describe('Verificação de limite antes de cada operação (soft warning / hard block)', () => {
    // Feature not implemented in the frontend: UsageLimitGuard applies a soft warning at 80%
    // and a hard block at 100% (e.g. on SendChatMessageService, ApproveDraftService), but
    // since the AI chat and draft-approval screens don't exist yet either, there is nothing
    // in the UI today that can trigger or display this warning/block to the user.
    //
    // test('should warn the professional when a metered action reaches 80% of the plan quota', async ({
    //     createAuthenticatedProfessional,
    //     page,
    // }) => {
    //     await createAuthenticatedProfessional();
    //     // perform the metered action enough times to reach 80% of quota
    //     await expect(page.getByText(/você atingiu 80% do seu limite/i)).toBeVisible();
    // });
    //
    // test('should block a metered action once the plan quota is fully exhausted', async ({page}) => {
    //     // perform the metered action enough times to reach 100% of quota
    //     await expect(page.getByText(/limite do plano atingido/i)).toBeVisible();
    // });
});

test.describe('Custo real por profissional (relatório interno)', () => {
    // Feature not implemented in the frontend: BillingReportService aggregates
    // ClinicalChatInteractionLog.costUsd by model/member/period with gross margin, but
    // there is no internal billing report screen in apps/web (this is distinct from the
    // per-interaction cost badge described in ai-assistive.test.ts, which is patient-facing;
    // this one is an internal/ops report).
    //
    // test('should let an OWNER view the AI cost breakdown by professional and model for a period', async ({
    //     createAuthenticatedProfessional,
    //     page,
    // }) => {
    //     await createAuthenticatedProfessional({user: {globalRole: 'OWNER'}});
    //     await page.goto('/settings/billing/ai-cost-report');
    //     await expect(page.getByText(/margem bruta/i)).toBeVisible();
    // });
});
