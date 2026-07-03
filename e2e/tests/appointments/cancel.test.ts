import {expect, test} from '@fixtures/test';

test.describe('Cancel appointment', () => {
    let clinicId: string;

    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        const professional = await createAuthenticatedProfessional();
        clinicId = professional.clinicId;
    });

    test('should cancel a scheduled appointment', async ({page, createPatient, appointmentListPage}) => {
        const patient = await createPatient({clinicId});

        await appointmentListPage.navigate();
        await appointmentListPage.createAppointment(patient.name);
        await appointmentListPage.openAppointment(patient.name);
        await appointmentListPage.cancelOpenAppointment();

        await appointmentListPage.openAppointment(patient.name);
        await expect(page.getByLabel(/detalhes do agendamento/i).getByText(/^cancelado$/i)).toBeVisible();
    });
});
