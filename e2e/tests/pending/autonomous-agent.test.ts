import {test} from '@fixtures/test';

// "Agente Autônomo" module from mvp-features.html: POST /agent/ask and the proposal
// governance flow (AgentProposalController) exist on the backend, but apps/web has no
// chat-with-agent surface and no proposal inbox.

test.describe('Loop de raciocínio com ferramentas clínicas', () => {
    // Feature not implemented in the frontend: AgentAskController drives an iterative
    // tool-use loop (agenda, prontuário, formulários, alertas, base de conhecimento), but
    // there is no chat UI to ask the autonomous agent anything.
    //
    // test('should let a professional ask the autonomous agent to summarize a patient\'s pending items', async ({
    //     createPatient,
    //     page,
    // }) => {
    //     const patient = await createPatient({clinicId});
    //     await page.goto('/agent');
    //     await page.getByLabel(/pergunte ao agente/i).fill(`O que está pendente para ${patient.name}?`);
    //     await page.getByRole('button', {name: /perguntar/i}).click();
    //     await expect(page.getByText(/resposta do agente/i)).toBeVisible();
    // });
});

test.describe('Propostas do agente e governança de mutações', () => {
    // Feature not implemented in the frontend: the agent proposes actions (create/cancel/
    // reschedule appointment, create alert) instead of executing them directly, and
    // AgentProposalController exposes confirm/reject/pending endpoints, but there is no
    // "Propostas pendentes" inbox for a professional to review and act on them.
    //
    // test('should let a professional confirm a pending agent proposal and see the mutation applied', async ({
    //     appointmentListPage,
    //     page,
    // }) => {
    //     await page.goto('/agent/proposals');
    //     await page.getByRole('button', {name: /confirmar/i}).first().click();
    //     await expect(page.getByText(/proposta confirmada/i)).toBeVisible();
    //     await appointmentListPage.navigate();
    //     // assert the proposed appointment now exists on the calendar
    // });
    //
    // test('should let a professional reject a pending agent proposal without applying it', async ({page}) => {
    //     await page.goto('/agent/proposals');
    //     await page.getByRole('button', {name: /rejeitar/i}).first().click();
    //     await expect(page.getByText(/proposta rejeitada/i)).toBeVisible();
    // });
});
