import {expect, test} from '@fixtures/test';

test.describe('Appointment status filters', () => {
    let clinicId: string;

    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        const professional = await createAuthenticatedProfessional();
        clinicId = professional.clinicId;
    });

    test('should hide cancelled appointments when the "Cancelado" filter is toggled off', async ({
        page,
        createPatient,
        appointmentListPage,
    }) => {
        const patient = await createPatient({clinicId});

        await appointmentListPage.navigate();
        await appointmentListPage.createAppointment(patient.name);
        await appointmentListPage.openAppointment(patient.name);
        await appointmentListPage.cancelOpenAppointment();

        await expect(appointmentListPage.apptBlock(patient.name)).toBeVisible();

        await page.getByRole('button', {name: /^cancelado$/i}).click();
        await expect(appointmentListPage.apptBlock(patient.name)).toBeHidden();

        await page.getByRole('button', {name: /^cancelado$/i}).click();
        await expect(appointmentListPage.apptBlock(patient.name)).toBeVisible();
    });
});
