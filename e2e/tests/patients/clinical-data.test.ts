import {expect, test} from '@fixtures/test';
import {createTestAppointment} from '@lib/factories';

test('a professional edits clinical data and sees critical alerts before care', async ({
    page,
    createAuthenticatedProfessional,
    createPatient,
    patientDetailPage,
    recordNewPage,
    appointmentListPage,
    receptionPage,
    db,
}) => {
    const professional = await createAuthenticatedProfessional({displayName: 'Dra. Camila'});
    const patient = await createPatient({
        clinicId: professional.clinicId,
        grantAccessTo: [professional.clinicMemberId],
    });
    const appointment = await createTestAppointment({
        clinicId: professional.clinicId,
        patientId: patient.id,
        memberId: professional.clinicMemberId,
        startAt: new Date(new Date().setHours(11, 0, 0, 0)),
    });
    await db.appointment.update({where: {id: appointment.id}, data: {status: 'ARRIVED'}});

    await patientDetailPage.navigate(patient.id);
    await page.getByRole('button', {name: 'Editar perfil clínico'}).click();
    const profileEditor = page.getByRole('dialog', {name: 'Editar perfil clínico'});
    await profileEditor.getByLabel('Profissional responsável').selectOption(professional.id);
    await profileEditor.getByLabel('Alergias conhecidas').fill('Penicilina');
    await profileEditor.getByLabel('Condições crônicas').fill('Asma');
    await profileEditor.getByLabel('Medicações em uso').fill('Budesonida');
    await profileEditor.getByRole('button', {name: 'Salvar'}).click();
    await expect(profileEditor).toBeHidden();
    await expect(page.getByText('Budesonida', {exact: true})).toBeVisible();

    await page.getByRole('button', {name: 'Novo alerta'}).click();
    const alertEditor = page.getByRole('dialog', {name: 'Novo alerta'});
    await alertEditor.getByLabel('Título do alerta').fill('Risco de anafilaxia');
    await alertEditor.getByLabel('Descrição').fill('Confirmar alergia antes da consulta.');
    await alertEditor.getByLabel('Gravidade').selectOption('HIGH');
    await alertEditor.getByRole('button', {name: 'Salvar'}).click();
    await expect(alertEditor).toBeHidden();

    await patientDetailPage.goToNewRecord();
    await recordNewPage.verifyPageLoaded();
    const preview = page.getByRole('region', {name: 'Antes do atendimento'});
    await expect(preview.getByRole('region', {name: 'Alertas críticos'})).toContainText('Risco de anafilaxia');
    for (const detail of ['Penicilina', 'Asma', 'Budesonida']) {
        await expect(preview.getByText(detail, {exact: true})).toBeVisible();
    }

    await appointmentListPage.navigate();
    await appointmentListPage.openAppointment(patient.name);
    await expect(page.getByRole('dialog').getByRole('region', {name: 'Alertas críticos'})).toContainText(
        'Risco de anafilaxia'
    );

    await receptionPage.navigate();
    const row = receptionPage.appointment(patient.name);
    await row.getByRole('button', {name: 'Chamar paciente'}).click();
    const clinicalReview = page.getByRole('dialog', {name: 'Antes do atendimento'});
    await expect(clinicalReview.getByRole('region', {name: 'Alertas críticos'})).toContainText('Risco de anafilaxia');
    await clinicalReview.getByRole('button', {name: 'Cancelar'}).click();

    await patientDetailPage.navigate(patient.id);
    await page.getByRole('button', {name: 'Editar alerta Risco de anafilaxia'}).click();
    const editAlert = page.getByRole('dialog', {name: 'Editar alerta'});
    await editAlert.getByLabel('Título do alerta').fill('Alerta revisado');
    await editAlert.getByLabel('Descrição').clear();
    await editAlert.getByLabel('Alerta ativo').uncheck();
    await editAlert.getByRole('button', {name: 'Salvar'}).click();
    await expect(editAlert).toBeHidden();
    await expect(page.getByText('Alerta revisado', {exact: true})).toBeVisible();
    await expect(page.getByText('Inativo', {exact: true})).toBeVisible();
    await expect(page.getByText('Confirmar alergia antes da consulta.', {exact: true})).toHaveCount(0);

    await patientDetailPage.goToNewRecord();
    await expect(preview.getByText('Penicilina', {exact: true})).toBeVisible();
    await expect(preview.getByRole('region', {name: 'Alertas críticos'})).toHaveCount(0);
});

test('registration access does not expose clinical data or interrupt the call', async ({
    page,
    createProfessional,
    createAuthenticatedClinicMember,
    createPatient,
    patientDetailPage,
    receptionPage,
    db,
}) => {
    const professional = await createProfessional();
    const secretary = await createAuthenticatedClinicMember({
        clinicId: professional.clinicId,
        role: 'SECRETARY',
    });
    const patient = await createPatient({
        clinicId: professional.clinicId,
        grantAccessTo: [secretary.id],
    });
    await db.clinicPatientAccess.updateMany({
        where: {patientId: patient.id, memberId: secretary.id},
        data: {accessLevel: 'REGISTER_ONLY'},
    });
    const appointment = await createTestAppointment({
        clinicId: professional.clinicId,
        patientId: patient.id,
        memberId: professional.clinicMemberId,
        startAt: new Date(),
    });
    await db.appointment.update({where: {id: appointment.id}, data: {status: 'ARRIVED'}});

    await patientDetailPage.navigate(patient.id);
    await patientDetailPage.verifyPageLoaded(patient.name);
    await expect(page.getByText('Perfil clínico', {exact: true})).toHaveCount(0);
    await expect(page.getByText('Alertas clínicos', {exact: true})).toHaveCount(0);

    await receptionPage.navigate();
    const row = receptionPage.appointment(patient.name);
    await row.getByRole('button', {name: 'Chamar paciente'}).click();
    await expect(row).toContainText('Em atendimento');
    await expect(page.getByRole('dialog', {name: 'Antes do atendimento'})).toHaveCount(0);
});
