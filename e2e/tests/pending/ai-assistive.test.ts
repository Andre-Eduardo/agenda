import {test} from '@fixtures/test';

// "IA Assistiva" module from mvp-features.html: RAG chat, context snapshots, the agent
// catalog and AI billing are all backend-only today — apps/web has no chat surface or AI
// configuration screen at all.

test.describe('Chat clínico por paciente com RAG', () => {
    // Feature not implemented in the frontend: PatientChatSession/PatientChatMessage with
    // pgvector-backed semantic search (SendChatMessageService) has no chat widget in the
    // patient detail page — professionals cannot ask questions about a patient's history.
    //
    // test('should let a professional ask a question about the patient in the clinical chat and get a grounded answer', async ({
    //     createPatient,
    //     patientDetailPage,
    //     page,
    // }) => {
    //     const patient = await createPatient({clinicId});
    //     await patientDetailPage.navigate(patient.id);
    //     await page.getByRole('tab', {name: /chat clínico/i}).click();
    //     await page.getByLabel(/pergunte sobre o paciente/i).fill('Quais alergias o paciente tem registradas?');
    //     await page.getByRole('button', {name: /enviar/i}).click();
    //     await expect(page.getByText(/fontes utilizadas/i)).toBeVisible();
    // });
});

test.describe('Catálogo de agentes especializados', () => {
    // Feature not implemented in the frontend: AiAgentProfile (baseInstructions,
    // analysisGoals, guardrails, providerModelId) is exposed via GET /agents and
    // GET /agents/resolve/:memberId, but there is no screen showing which agent is active
    // for the logged-in professional beyond the small "ai-nudge" hint on the settings page.
    //
    // test('should show which specialized AI agent is resolved for the current professional', async ({
    //     createAuthenticatedProfessional,
    //     page,
    // }) => {
    //     await createAuthenticatedProfessional();
    //     await page.goto('/settings/ai-agents');
    //     await expect(page.getByText(/agente ativo/i)).toBeVisible();
    // });
});

test.describe('Billing interno de IA — custo por interação', () => {
    // Feature not implemented in the frontend: costUsd is computed per interaction via
    // calculateCostUsd() and stored on ClinicalChatInteractionLog, but there is no dashboard
    // showing a professional or clinic their AI usage cost.
    //
    // test('should show the accumulated AI cost for the current billing period', async ({
    //     createAuthenticatedProfessional,
    //     page,
    // }) => {
    //     await createAuthenticatedProfessional();
    //     await page.goto('/settings/ai-usage');
    //     await expect(page.getByText(/custo estimado no período/i)).toBeVisible();
    // });
});
