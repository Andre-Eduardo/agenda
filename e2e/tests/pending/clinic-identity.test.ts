import {test} from '@fixtures/test';

// This suite tracks e2e coverage for the "Identidade & Clínica" module features listed in
// mvp-features.html that have backend support but no consuming UI in apps/web yet.
// Each block below documents the scenario to automate once the screen exists — do not
// uncomment until the referenced page/flow is implemented.

test.describe('Dados da clínica — endereço, logo e especialidades', () => {
    // Feature not implemented: there is no clinic settings screen. Clinic.address,
    // Clinic.logoUrl and Clinic.clinicSpecialties[] are persisted by UpdateClinicService
    // and exposed via PATCH /clinics/:id, but apps/web has no route to edit them —
    // settings/pages/index only exposes the professional's own profile (identity/pro/office/security tabs).
    //
    // test('should let an OWNER update the clinic address, logo and specialties from a clinic settings page', async ({
    //     createAuthenticatedProfessional,
    //     page,
    // }) => {
    //     await createAuthenticatedProfessional({user: {globalRole: 'OWNER'}});
    //     await page.goto('/settings/clinic');
    //     await page.getByLabel(/logradouro/i).fill('Av. Paulista, 1000');
    //     await page.getByLabel(/especialidades/i).click();
    //     await page.getByRole('option', {name: /cardiologia/i}).click();
    //     await page.getByRole('button', {name: /salvar alterações/i}).click();
    //     await expect(page.getByText(/clínica atualizada/i)).toBeVisible();
    // });
});

test.describe('Convite de membros da clínica', () => {
    // Feature not implemented: CreateClinicMemberService records invitedByMemberId, but
    // there is no "Team" / "Membros" screen to send an invite, list pending invites, or
    // accept one — apps/web has no clinic-member module at all.
    //
    // test('should let an OWNER invite a new clinic member by email and role', async ({
    //     createAuthenticatedProfessional,
    //     page,
    // }) => {
    //     await createAuthenticatedProfessional({user: {globalRole: 'OWNER'}});
    //     await page.goto('/settings/team');
    //     await page.getByRole('button', {name: /convidar membro/i}).click();
    //     await page.getByLabel(/e-mail/i).fill('nova.secretaria@example.com');
    //     await page.getByLabel(/papel/i).selectOption('SECRETARY');
    //     await page.getByRole('button', {name: /enviar convite/i}).click();
    //     await expect(page.getByText(/convite enviado/i)).toBeVisible();
    // });
});

test.describe('Perfis de acesso por papel (OWNER, ADMIN, PROFESSIONAL, SECRETARY, VIEWER)', () => {
    // Feature not implemented in the frontend: role resolution exists on the backend
    // (3-layer resolution), but there is no UI to change a member's role, and useCan()
    // is a placeholder that always returns true (see apps/web CLAUDE.md), so role-based
    // UI restrictions cannot be verified end-to-end yet.
    //
    // test('should hide destructive actions for a VIEWER role member', async ({
    //     createAuthenticatedProfessional,
    //     appointmentListPage,
    // }) => {
    //     await createAuthenticatedProfessional({user: {globalRole: 'VIEWER'}});
    //     await appointmentListPage.navigate();
    //     await expect(appointmentListPage.newAppointmentButton).toBeHidden();
    // });
});
