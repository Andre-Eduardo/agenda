import {expect, test} from '@fixtures/test';
import {createTestAppointment, createTestRecord} from '@lib/factories';

test.describe('Dashboard navigation', () => {
    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        await createAuthenticatedProfessional();
    });

    test('should load the dashboard page', async ({dashboardPage}) => {
        await dashboardPage.navigate();
        await dashboardPage.verifyPageLoaded();
    });

    test('should redirect the root route to the dashboard', async ({page, dashboardPage}) => {
        await page.goto('/');
        await expect(page).toHaveURL(/\/dashboard$/);
        await dashboardPage.verifyPageLoaded();
    });

    test('should match the dashboard visual snapshot', {tag: '@visual'}, async ({page, dashboardPage}) => {
        // Freeze the clock so the date text is deterministic across runs.
        await page.clock.setFixedTime(new Date('2026-03-03T09:30:00.000Z'));

        await dashboardPage.navigate();
        await dashboardPage.verifyPageLoaded();
        await dashboardPage.compareScreenshot('dashboard-page');
    });
});

test('shows the patient and opens an upcoming appointment', async ({
    page,
    dashboardPage,
    createAuthenticatedProfessional,
    createPatient,
}) => {
    const professional = await createAuthenticatedProfessional();
    const patient = await createPatient({clinicId: professional.clinicId, name: 'Marina Dashboard'});
    const startAt = new Date(Date.now() + 3 * 86_400_000);

    startAt.setUTCHours(15, 0, 0, 0);

    const appointment = await createTestAppointment({
        clinicId: professional.clinicId,
        patientId: patient.id,
        memberId: professional.clinicMemberId,
        startAt,
    });

    await dashboardPage.navigate();

    const appointmentLink = page.getByRole('link', {name: /Abrir agendamento de Marina Dashboard/});

    await expect(appointmentLink).toBeVisible();
    await expect(appointmentLink).toContainText('12:00');
    await appointmentLink.click();

    await expect(page).toHaveURL(new RegExp(`appointmentId=${appointment.id}`));
    await expect(page.getByRole('heading', {name: 'Detalhes do agendamento'})).toBeVisible();
    await expect(page.getByText(patient.name).first()).toBeVisible();
});

test('identifies a recent record and opens its detail from a short preview', async ({
    page,
    dashboardPage,
    createAuthenticatedProfessional,
    createPatient,
}) => {
    const professional = await createAuthenticatedProfessional();
    const patient = await createPatient({clinicId: professional.clinicId, name: 'Bruno Dashboard'});
    const note = 'Paciente relata melhora gradual e segue o plano de acompanhamento. '.repeat(4);
    const record = await createTestRecord({
        clinicId: professional.clinicId,
        patientId: patient.id,
        memberId: professional.clinicMemberId,
        professionalId: professional.id,
        title: 'Retorno de acompanhamento',
        subjective: note,
    });

    await dashboardPage.navigate();

    const recordLink = page.getByRole('link', {name: /Abrir evolução de Bruno Dashboard/});

    await expect(recordLink).toBeVisible();
    await expect(recordLink).toContainText('Retorno de acompanhamento');
    await expect(recordLink).toContainText('…');
    await expect(recordLink).not.toContainText(note);
    await recordLink.click();

    await expect(page).toHaveURL(new RegExp(`/records/${record.id}$`));
    await expect(page.getByText(patient.name).first()).toBeVisible();
});
