import {test} from '@fixtures/test';

// "Agenda & Atendimentos" scenarios from mvp-features.html whose backend entities and
// endpoints exist (WorkingHours, MemberBlock, checkin/call, AppointmentReminder) but which
// have no corresponding UI in apps/web/src/views/modules/appointments today. The calendar
// only exposes create/edit/cancel (see e2e/tests/appointments/*.test.ts).

test.describe('Horários de trabalho por profissional', () => {
    // Feature not implemented in the frontend: WorkingHours (dayOfWeek, startTime, endTime,
    // slotDuration) is used internally by CreateAppointmentService to validate conflicts and
    // has CRUD endpoints, but there is no settings screen for a professional to define their
    // weekly availability.
    //
    // test('should let a professional configure working hours and reject appointments outside them', async ({
    //     createAuthenticatedProfessional,
    //     appointmentListPage,
    //     page,
    // }) => {
    //     await createAuthenticatedProfessional();
    //     await page.goto('/settings/working-hours');
    //     await page.getByLabel(/segunda-feira/i).check();
    //     await page.getByLabel(/início/i).fill('08:00');
    //     await page.getByLabel(/fim/i).fill('12:00');
    //     await page.getByRole('button', {name: /salvar horários/i}).click();
    //
    //     await appointmentListPage.navigate();
    //     // attempt to schedule at 14:00 on a Monday, outside the configured range
    //     await expect(page.getByText(/fora do horário de atendimento/i)).toBeVisible();
    // });
});

test.describe('Bloqueio de agenda (MemberBlock)', () => {
    // Feature not implemented in the frontend: MemberBlock (startAt, endAt, reason) has full
    // CRUD endpoints and is checked by CreateAppointmentService for conflicts, but the
    // calendar has no "Bloquear horário" action, so blocks cannot be created/edited/removed
    // from the UI.
    //
    // test('should let a professional block a time range and prevent scheduling over it', async ({
    //     createAuthenticatedProfessional,
    //     appointmentListPage,
    //     page,
    // }) => {
    //     await createAuthenticatedProfessional();
    //     await appointmentListPage.navigate();
    //     await page.getByRole('button', {name: /bloquear horário/i}).click();
    //     await page.getByLabel(/motivo/i).fill('Congresso médico');
    //     await page.getByRole('button', {name: /confirmar bloqueio/i}).click();
    //     await expect(page.getByText(/congresso médico/i)).toBeVisible();
    // });
});

test.describe('Check-in / status de chegada na recepção', () => {
    // Feature not implemented in the frontend: ARRIVED and IN_PROGRESS exist in
    // STATUS_LABELS (appointments/pages/index/index.tsx) and CheckinAppointmentService /
    // CallAppointmentService expose POST /appointments/:id/checkin and /call, but the
    // appointment detail sheet only offers "Editar" and "Cancelar consulta" — there is no
    // "Registrar chegada" / "Chamar paciente" action for reception staff.
    //
    // test('should let a receptionist check in a patient and then call them into the room', async ({
    //     createPatient,
    //     appointmentListPage,
    //     page,
    // }) => {
    //     const patient = await createPatient({clinicId});
    //     await appointmentListPage.navigate();
    //     await appointmentListPage.createAppointment(patient.name);
    //     await appointmentListPage.openAppointment(patient.name);
    //     await page.getByRole('button', {name: /registrar chegada/i}).click();
    //     await expect(page.getByText(/^chegou$/i)).toBeVisible();
    //     await page.getByRole('button', {name: /chamar paciente/i}).click();
    //     await expect(page.getByText(/em atendimento/i)).toBeVisible();
    // });
});

test.describe('Confirmação e lembretes automáticos', () => {
    // Feature not implemented in the frontend: ClinicReminderConfig (enabledChannels,
    // hoursBeforeList) has endpoints and ScheduleRemindersService creates PENDING
    // AppointmentReminder rows automatically on booking, but there is no settings screen to
    // configure reminder channels/timing, and no UI surface showing which reminders were sent
    // for a given appointment.
    //
    // test('should let an OWNER configure reminder channels and hours-before list', async ({
    //     createAuthenticatedProfessional,
    //     page,
    // }) => {
    //     await createAuthenticatedProfessional({user: {globalRole: 'OWNER'}});
    //     await page.goto('/settings/reminders');
    //     await page.getByLabel(/whatsapp/i).check();
    //     await page.getByLabel(/horas antes/i).fill('24, 2');
    //     await page.getByRole('button', {name: /salvar/i}).click();
    //     await expect(page.getByText(/configuração de lembretes salva/i)).toBeVisible();
    // });
});
