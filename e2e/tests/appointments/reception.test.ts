import {expect, test} from '@fixtures/test';
import {createTestAppointment} from '@lib/factories';

test.describe('Reception operations', () => {
    test('secretary records arrival and call, then opens the patient without editing the appointment', async ({
        createProfessional,
        createAuthenticatedClinicMember,
        createPatient,
        receptionPage,
        db,
    }) => {
        const professional = await createProfessional();
        const secretary = await createAuthenticatedClinicMember({clinicId: professional.clinicId, role: 'SECRETARY'});
        const patient = await createPatient({clinicId: professional.clinicId, grantAccessTo: [secretary.id]});
        const appointment = await createTestAppointment({
            clinicId: professional.clinicId,
            patientId: patient.id,
            memberId: professional.clinicMemberId,
            startAt: new Date(),
        });

        await receptionPage.navigate();
        await receptionPage.verifyPageLoaded();

        const row = receptionPage.appointment(patient.name);

        await expect(row).toBeVisible();
        await expect(row.getByRole('button', {name: /editar/i})).toHaveCount(0);

        await row.getByRole('button', {name: 'Registrar chegada'}).click();
        await expect(row).toContainText('Chegou');
        await row.getByRole('button', {name: 'Chamar paciente'}).click();
        await expect(row).toContainText('Em atendimento');
        await expect.poll(async () => (await db.appointment.findUnique({where: {id: appointment.id}}))?.status).toBe(
            'IN_PROGRESS'
        );

        await row.getByRole('link', {name: `Abrir perfil de ${patient.name}`}).click();
        await expect(receptionPage.page).toHaveURL(new RegExp(`/patients/${patient.id}($|\\?)`));
    });

    test('no-show requires confirmation and moves the appointment to finished', async ({
        createProfessional,
        createAuthenticatedClinicMember,
        createPatient,
        receptionPage,
        db,
    }) => {
        const professional = await createProfessional();
        const secretary = await createAuthenticatedClinicMember({clinicId: professional.clinicId, role: 'SECRETARY'});
        const patient = await createPatient({clinicId: professional.clinicId, grantAccessTo: [secretary.id]});
        const appointment = await createTestAppointment({
            clinicId: professional.clinicId,
            patientId: patient.id,
            memberId: professional.clinicMemberId,
            startAt: new Date(),
        });

        await receptionPage.navigate();
        const row = receptionPage.appointment(patient.name);

        await expect(row).toBeVisible();
        await row.getByRole('button', {name: 'Marcar falta'}).click();
        await expect(receptionPage.page.getByRole('dialog', {name: 'Confirmar falta'})).toBeVisible();
        await receptionPage.page.getByRole('dialog').getByRole('button', {name: 'Cancelar'}).click();
        await expect(row).toContainText('Agendado');

        await row.getByRole('button', {name: 'Marcar falta'}).click();
        await receptionPage.page.getByRole('dialog').getByRole('button', {name: 'Marcar falta'}).click();

        await expect(row).toContainText('Faltou');
        await expect.poll(async () => (await db.appointment.findUnique({where: {id: appointment.id}}))?.status).toBe(
            'NO_SHOW'
        );
        await expect(row.getByRole('button', {name: 'Marcar falta'})).toHaveCount(0);
    });

    test('viewer can open the patient but cannot perform reception transitions', async ({
        createProfessional,
        createAuthenticatedClinicMember,
        createPatient,
        receptionPage,
    }) => {
        const professional = await createProfessional();
        const viewer = await createAuthenticatedClinicMember({clinicId: professional.clinicId, role: 'VIEWER'});
        const patient = await createPatient({clinicId: professional.clinicId, grantAccessTo: [viewer.id]});

        await createTestAppointment({
            clinicId: professional.clinicId,
            patientId: patient.id,
            memberId: professional.clinicMemberId,
            startAt: new Date(),
        });

        await receptionPage.navigate();

        const row = receptionPage.appointment(patient.name);

        await expect(row).toBeVisible();
        await expect(row.getByRole('link', {name: `Abrir perfil de ${patient.name}`})).toBeVisible();
        await expect(row.getByRole('button', {name: 'Registrar chegada'})).toHaveCount(0);
        await expect(row.getByRole('button', {name: 'Marcar falta'})).toHaveCount(0);
    });
});
