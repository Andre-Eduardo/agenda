import {expect, test} from '@fixtures/test';
import {createTestAppointment} from '@lib/factories';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

test.describe('Reception operations', () => {
    test('shows the scheduled professional and visit type separately for the same patient', async ({
        createProfessional,
        createAuthenticatedClinicMember,
        createPatient,
        receptionPage,
    }) => {
        const first = await createProfessional({displayName: 'Dra. Ana Gomes'});
        const {clinicId} = first;
        const second = await createProfessional({clinicId, displayName: 'Dr. Bruno Lima'});
        const secretary = await createAuthenticatedClinicMember({clinicId, role: 'SECRETARY'});
        const patient = await createPatient({clinicId, grantAccessTo: [secretary.id]});
        const startAt = new Date();
        await createTestAppointment({
            clinicId,
            patientId: patient.id,
            memberId: first.clinicMemberId,
            startAt,
            type: 'FIRST_VISIT',
        });
        await createTestAppointment({
            clinicId,
            patientId: patient.id,
            memberId: second.clinicMemberId,
            startAt,
            type: 'RETURN',
        });

        await receptionPage.navigate();
        const appointments = receptionPage.appointment(patient.name);
        const firstVisit = appointments.filter({hasText: 'Dra. Ana Gomes'});
        const followUp = appointments.filter({hasText: 'Dr. Bruno Lima'});

        await expect(appointments).toHaveCount(2);
        await expect(firstVisit.getByText('Primeira consulta', {exact: true})).toBeVisible();
        await expect(followUp.getByText('Retorno', {exact: true})).toBeVisible();

        await firstVisit.getByRole('button', {name: 'Registrar chegada'}).click();

        await expect(firstVisit.getByText('Chegou', {exact: true})).toBeVisible();
        await expect(firstVisit.getByText('Primeira consulta', {exact: true})).toBeVisible();
        await expect(followUp.getByText('Agendado', {exact: true})).toBeVisible();
    });

    test('secretary records arrival and call, completes the visit, and opens the patient', async ({
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
        await expect(row.getByRole('button', {name: 'Concluir atendimento'})).toHaveCount(0);
        const completeUrl = `${API_URL}/api/v1/appointments/${appointment.id}/complete`;
        expect((await receptionPage.page.request.patch(completeUrl)).status()).toBe(409);

        await row.getByRole('button', {name: 'Registrar chegada'}).click();
        await expect(row).toContainText('Chegou');
        await row.getByRole('button', {name: 'Chamar paciente'}).click();
        const review = receptionPage.page.getByRole('dialog', {name: 'Antes do atendimento'});
        await expect(review).toContainText('Nenhum alerta crítico ativo.');
        await review.getByRole('button', {name: 'Chamar paciente'}).click();
        await expect(row).toContainText('Em atendimento');
        await expect.poll(async () => (await db.appointment.findUnique({where: {id: appointment.id}}))?.status).toBe(
            'IN_PROGRESS'
        );

        await row.getByRole('button', {name: 'Concluir atendimento'}).click();
        const finished = receptionPage.page.getByRole('region', {name: 'Finalizados'});
        await expect(finished.getByRole('article', {name: `Consulta de ${patient.name}`})).toContainText('Concluído');
        await expect(row.getByRole('button', {name: 'Concluir atendimento'})).toHaveCount(0);
        const completion = await db.appointmentStatusTransition.findFirst({
            where: {appointmentId: appointment.id, toStatus: 'COMPLETED'},
        });
        expect(completion).toMatchObject({actorMemberId: secretary.id, occurredAt: expect.any(Date)});

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
        db,
    }) => {
        const professional = await createProfessional();
        const viewer = await createAuthenticatedClinicMember({clinicId: professional.clinicId, role: 'VIEWER'});
        const patient = await createPatient({clinicId: professional.clinicId, grantAccessTo: [viewer.id]});

        const appointment = await createTestAppointment({
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

        await db.appointment.update({where: {id: appointment.id}, data: {status: 'IN_PROGRESS'}});
        await receptionPage.page.getByRole('button', {name: 'Atualizar'}).click();
        await expect(row).toContainText('Em atendimento');
        await expect(row.getByRole('button', {name: 'Concluir atendimento'})).toHaveCount(0);
        const response = await receptionPage.page.request.patch(`${API_URL}/api/v1/appointments/${appointment.id}/complete`);
        expect(response.status()).toBe(403);
        expect((await db.appointment.findUnique({where: {id: appointment.id}}))?.status).toBe('IN_PROGRESS');
    });
});
