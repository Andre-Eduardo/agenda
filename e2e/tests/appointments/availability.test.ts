import {expect, test} from '@fixtures/test';

/**
 * Working-hours / member-block violations are advisory only (Fase 3): the backend
 * returns a 409 with a known `detail` code, the frontend surfaces a confirm dialog
 * ("Fora da disponibilidade do profissional"), and confirming proceeds with creation.
 */
test.describe('Appointment availability warnings', () => {
    let clinicId: string;
    let clinicMemberId: string;

    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        const professional = await createAuthenticatedProfessional();
        clinicId = professional.clinicId;
        clinicMemberId = professional.clinicMemberId;
    });

    test('should warn and allow confirming an appointment outside working hours', async ({
        createPatient,
        createWorkingHours,
        appointmentListPage,
    }) => {
        const patient = await createPatient({clinicId});
        const today = new Date();

        // Narrow morning-only expediente — 20:00 falls well outside it.
        await createWorkingHours({
            clinicId,
            clinicMemberId,
            dayOfWeek: today.getDay(),
            startTime: '08:00',
            endTime: '09:00',
            active: true,
        });

        await appointmentListPage.navigate();
        await appointmentListPage.createAppointment(patient.name, {
            startTime: '20:00',
            confirmOutsideAvailability: true,
        });

        await expect(appointmentListPage.page.getByText('Consulta agendada')).toBeVisible();
        await expect(appointmentListPage.apptBlock(patient.name)).toBeVisible();
    });

    test('should explain and hard-block overlapping appointments', async ({createPatients, appointmentListPage}) => {
        const [patientA, patientB] = await createPatients([{clinicId}, {clinicId}]);

        await appointmentListPage.navigate();
        await appointmentListPage.createAppointment(patientA.name, {startTime: '10:00', durationMin: 60});
        await appointmentListPage.createAppointmentExpectConflict(
            patientB.name,
            /profissional já tem uma consulta nesse horário/i,
            {startTime: '10:30', durationMin: 30}
        );

        await appointmentListPage.createCancelButton.click();
        await expect(appointmentListPage.apptBlock(patientB.name)).toBeHidden();
    });

    test('should warn and allow confirming an appointment over a member block', async ({
        createPatient,
        createMemberBlock,
        appointmentListPage,
    }) => {
        const patient = await createPatient({clinicId});
        const today = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

        await createMemberBlock({
            clinicId,
            clinicMemberId,
            startAt: new Date(`${dateStr}T14:00:00`),
            endAt: new Date(`${dateStr}T15:00:00`),
            reason: 'Almoço',
        });

        await appointmentListPage.navigate();
        await expect(appointmentListPage.page.getByRole('note', {name: 'Bloqueado: Almoço'})).toBeVisible();
        await expect(appointmentListPage.page.getByText('Bloqueado: Almoço')).toBeVisible();
        await appointmentListPage.createAppointment(patient.name, {
            startTime: '14:30',
            confirmOutsideAvailability: true,
        });

        await expect(appointmentListPage.page.getByText('Consulta agendada')).toBeVisible();
        await expect(appointmentListPage.apptBlock(patient.name)).toBeVisible();
    });
});
