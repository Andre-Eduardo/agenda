import {expect, test} from '@fixtures/test';

test.describe('Create appointment', () => {
    let clinicId: string;

    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        const professional = await createAuthenticatedProfessional();
        clinicId = professional.clinicId;
    });

    test('should schedule an appointment for an existing patient', async ({
        createPatient,
        appointmentListPage,
    }) => {
        const patient = await createPatient({clinicId});

        await appointmentListPage.navigate();
        await appointmentListPage.createAppointment(patient.name);

        await expect(appointmentListPage.apptBlock(patient.name)).toBeVisible();
    });
});
