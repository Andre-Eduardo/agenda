import {expect, test} from '@fixtures/test';

test.describe('Calendar view modes', () => {
    let clinicId: string;

    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        const professional = await createAuthenticatedProfessional();
        clinicId = professional.clinicId;
    });

    test('should keep a today-scheduled appointment visible across day, week and month views', async ({
        createPatient,
        appointmentListPage,
    }) => {
        // Two-word name: the month view truncates patient names to their first two words
        // (MonthView in appointments/pages/index/index.tsx), so a longer name would not
        // match the full-name locator used across all three views.
        const patient = await createPatient({clinicId, name: `Ana Teste${Date.now()}`});

        await appointmentListPage.navigate();
        await appointmentListPage.createAppointment(patient.name);

        await expect(appointmentListPage.apptBlock(patient.name)).toBeVisible();

        await appointmentListPage.dayViewButton.click();
        await expect(appointmentListPage.apptBlock(patient.name)).toBeVisible();

        await appointmentListPage.monthViewButton.click();
        await expect(appointmentListPage.apptBlock(patient.name)).toBeVisible();

        await appointmentListPage.weekViewButton.click();
        await expect(appointmentListPage.apptBlock(patient.name)).toBeVisible();
    });
});
