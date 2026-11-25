import {expect, test} from '@fixtures/test';
import {uuidv7} from 'uuidv7';

test('completes a visit from scheduling through payment and follow-up', async ({
    page,
    db,
    createAuthenticatedProfessional,
    createPatient,
    settingsPage,
    appointmentListPage,
    receptionPage,
    recordNewPage,
    recordDetailPage,
}) => {
    const professional = await createAuthenticatedProfessional({additionalRoles: ['OWNER']});
    const {clinicId, clinicMemberId} = professional;
    const patient = await createPatient({clinicId, grantAccessTo: [clinicMemberId]});
    const procedure = 'Consulta de acompanhamento';
    const alert = 'Alergia grave a penicilina';
    const plan = 'Reavaliar exames na próxima consulta.';
    const now = new Date();

    await db.patientAlert.create({
        data: {
            id: uuidv7(),
            clinicId,
            patientId: patient.id,
            createdByMemberId: clinicMemberId,
            title: alert,
            severity: 'HIGH',
            createdAt: now,
            updatedAt: now,
        },
    });
    await settingsPage.navigate();
    await settingsPage.createProcedure(procedure, '45', '120,00');

    const appointment = await test.step('Schedule the visit with a procedure', async () => {
        await appointmentListPage.navigate();
        await appointmentListPage.startNewAppointment(patient.name);

        const scheduling = page.getByRole('dialog', {name: 'Novo agendamento'});
        await scheduling.getByRole('combobox', {name: 'Procedimento ou serviço'}).click();
        await page.getByRole('option', {name: procedure, exact: true}).click();
        await appointmentListPage.createSubmitButton.click();
        await expect(scheduling).toBeHidden();

        const visit = await db.appointment.findFirstOrThrow({where: {clinicId, patientId: patient.id}});
        expect(visit).toMatchObject({
            status: 'SCHEDULED',
            attendedByMemberId: clinicMemberId,
            procedureName: procedure,
            procedurePriceInCents: 12000,
        });
        return visit;
    });

    await test.step('Record the arrival and review the critical alert before calling', async () => {
        await receptionPage.navigate();
        const row = receptionPage.appointment(patient.name);

        await row.getByRole('button', {name: 'Registrar chegada'}).click();
        await expect(row).toContainText('Chegou');
        await row.getByRole('button', {name: 'Chamar paciente'}).click();

        const review = page.getByRole('dialog', {name: 'Antes do atendimento'});
        await expect(review.getByRole('region', {name: 'Alertas críticos'})).toContainText(alert);
        await review.getByRole('button', {name: 'Chamar paciente'}).click();
        await expect(row).toContainText('Em atendimento');
    });

    const record = await test.step('Publish and sign the evolution linked to this visit', async () => {
        await appointmentListPage.navigate();
        await appointmentListPage.openAppointment(patient.name);
        const detail = page.getByRole('dialog', {name: 'Detalhes do agendamento'});

        await detail.getByRole('link', {name: 'Registrar evolução'}).click();
        await recordNewPage.verifyPageLoaded();
        await expect(page.getByRole('region', {name: 'Alertas críticos'})).toContainText(alert);
        await recordNewPage.fillSoap({subjective: 'Paciente retornou com os exames solicitados.', plan});
        await recordNewPage.publish();

        await recordDetailPage.verifyPageLoaded();
        await recordDetailPage.sign();
        const signed = await db.record.findFirstOrThrow({where: {appointmentId: appointment.id}});
        expect(signed).toMatchObject({
            patientId: patient.id,
            responsibleProfessionalId: professional.id,
            signedByMemberId: clinicMemberId,
            isLocked: true,
            plan,
        });
        return signed;
    });

    await test.step('Complete the visit and record its Pix payment', async () => {
        await appointmentListPage.navigate();
        await appointmentListPage.openAppointment(patient.name);
        const detail = page.getByRole('dialog', {name: 'Detalhes do agendamento'});

        await detail.getByRole('button', {name: 'Concluir atendimento'}).click();
        await expect(detail.getByText('Realizado', {exact: true})).toBeVisible();

        const payment = detail.getByRole('group', {name: 'Pagamento'});
        const register = payment.getByRole('button', {name: 'Registrar pagamento', exact: true});
        await register.click();
        const amount = payment.getByLabel('Valor (R$)', {exact: true});
        await expect(amount).toHaveValue('120.00');
        await register.click();
        await expect(amount).toBeHidden();
        await expect(payment.getByText('Pago', {exact: true})).toBeVisible();
        await expect(payment.getByText('Pix', {exact: true})).toBeVisible();
        expect(await db.appointmentPayment.findUniqueOrThrow({where: {appointmentId: appointment.id}})).toMatchObject({
            status: 'PAID',
            amountBrl: 120,
            paymentMethod: 'PIX',
        });
    });

    await test.step('Schedule and reopen the follow-up linked to the signed evolution', async () => {
        await recordDetailPage.navigate(patient.id, record.id);
        await page.getByRole('link', {name: 'Agendar retorno'}).click();

        const followUp = page.getByRole('dialog', {name: 'Agendar retorno'});
        await expect(followUp.getByText(patient.name, {exact: true})).toBeVisible();
        await followUp.getByRole('button', {name: 'Agendar retorno'}).click();

        const followUpLink = page.getByRole('link', {name: /^Ver retorno de .*Agendado$/});
        await expect(followUpLink).toBeVisible();

        const nextVisit = await db.appointment.findFirstOrThrow({where: {followUpFromRecordId: record.id}});
        expect(nextVisit).toMatchObject({patientId: patient.id, attendedByMemberId: clinicMemberId, type: 'RETURN'});
        expect(nextVisit.startAt.getTime()).toBeGreaterThan(appointment.startAt.getTime());

        await followUpLink.click();
        await expect(page).toHaveURL(new RegExp(`appointmentId=${nextVisit.id}`));
        await expect(page.getByRole('dialog', {name: 'Detalhes do agendamento'})).toBeVisible();
    });
});
