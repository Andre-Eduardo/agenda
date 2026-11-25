import {expect, test} from '@fixtures/test';
import {createTestAppointment, createTestRecord} from '@lib/factories';

test('schedules a future return from a saved evolution and opens it in the agenda', async ({
    page,
    db,
    createAuthenticatedProfessional,
    createPatient,
    recordDetailPage,
}) => {
    const professional = await createAuthenticatedProfessional({displayName: 'Dra. Júlia Retorno'});
    const patient = await createPatient({
        clinicId: professional.clinicId,
        grantAccessTo: [professional.clinicMemberId],
    });
    const originalVisit = await createTestAppointment({
        clinicId: professional.clinicId,
        patientId: patient.id,
        memberId: professional.clinicMemberId,
        startAt: new Date(),
    });
    const record = await createTestRecord({
        clinicId: professional.clinicId,
        patientId: patient.id,
        memberId: professional.clinicMemberId,
        professionalId: professional.id,
        title: 'Avaliação de acompanhamento',
        subjective: 'Paciente trouxe os resultados.',
    });
    const plan = 'Reavaliar os exames no retorno.';
    await db.record.update({
        where: {id: record.id},
        data: {plan, appointmentId: originalVisit.id, isLocked: true},
    });

    await recordDetailPage.navigate(patient.id, record.id);
    await page.getByRole('link', {name: 'Agendar retorno'}).click();
    const form = page.getByRole('dialog', {name: 'Agendar retorno'});
    await expect(form.getByText(patient.name, {exact: true})).toBeVisible();
    await expect(form.getByText('Dra. Júlia Retorno', {exact: true})).toBeVisible();
    await form.getByText('Ver plano e conduta da evolução', {exact: true}).click();
    await expect(form.getByText(plan, {exact: true})).toBeVisible();
    await form.getByRole('button', {name: 'Agendar retorno'}).click();

    await recordDetailPage.verifyPageLoaded();
    const visit = page.getByRole('link', {name: /^Ver retorno de .*Agendado$/});
    await expect(visit).toBeVisible();

    const persisted = await db.appointment.findFirstOrThrow({where: {followUpFromRecordId: record.id}});
    expect(persisted).toMatchObject({
        clinicId: professional.clinicId,
        patientId: patient.id,
        attendedByMemberId: professional.clinicMemberId,
        type: 'RETURN',
        note: null,
    });
    expect(await db.record.findUnique({where: {id: record.id}})).toMatchObject({
        appointmentId: originalVisit.id,
        isLocked: true,
        plan,
    });

    await page.reload();
    await visit.click();
    await expect(page).toHaveURL(new RegExp(`appointmentId=${persisted.id}`));
    await expect(page.getByRole('heading', {name: 'Detalhes do agendamento'})).toBeVisible();
});
