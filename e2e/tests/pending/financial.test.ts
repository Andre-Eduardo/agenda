import {test} from '@fixtures/test';

// "Financeiro — Atendimento" module from mvp-features.html: AppointmentPayment and
// FinancialReportService are fully implemented on the backend, but the calendar UI
// (appointments/pages/index) never shows or edits payment status, and there is no reports
// screen.

test.describe('Registro de pagamento por atendimento', () => {
    // Feature not implemented in the frontend: AppointmentPayment supports 7 methods (CASH,
    // PIX, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, INSURANCE, COURTESY) plus
    // insurancePlanId/insuranceAuthCode, but the appointment detail sheet
    // (AppointmentDetailSheet in appointments/pages/index/index.tsx) has no "Registrar
    // pagamento" action.
    //
    // test('should let a professional register a PIX payment for a completed appointment', async ({
    //     createPatient,
    //     appointmentListPage,
    //     page,
    // }) => {
    //     const patient = await createPatient({clinicId});
    //     await appointmentListPage.navigate();
    //     await appointmentListPage.createAppointment(patient.name);
    //     await appointmentListPage.openAppointment(patient.name);
    //     await page.getByRole('button', {name: /registrar pagamento/i}).click();
    //     await page.getByLabel(/método/i).selectOption('PIX');
    //     await page.getByRole('button', {name: /confirmar pagamento/i}).click();
    //     await expect(page.getByText(/pago via pix/i)).toBeVisible();
    // });
});

test.describe('Status financeiro vinculado à agenda', () => {
    // Feature not implemented in the frontend: paymentStatus is derived from
    // AppointmentPayment and returned by GET /appointments, but the calendar's status chips
    // and blocks only reflect AppointmentStatus (SCHEDULED/CONFIRMED/…), never payment state.
    //
    // test('should show a payment status badge on an appointment that has been paid', async ({
    //     appointmentListPage,
    //     page,
    // }) => {
    //     await appointmentListPage.navigate();
    //     await expect(page.getByText(/pago/i)).toBeVisible();
    // });
});

test.describe('Relatório simples de recebimentos', () => {
    // Feature not implemented in the frontend: FinancialReportService aggregates totalBrl,
    // avgTicket, byPaymentMethod and byProfessional with period filters, but there is no
    // "Financeiro" report page in apps/web.
    //
    // test('should let an OWNER filter the financial report by period and see totals by payment method', async ({
    //     createAuthenticatedProfessional,
    //     page,
    // }) => {
    //     await createAuthenticatedProfessional({user: {globalRole: 'OWNER'}});
    //     await page.goto('/financial/reports');
    //     await page.getByLabel(/período/i).selectOption('last-30-days');
    //     await expect(page.getByText(/total recebido/i)).toBeVisible();
    // });
});
