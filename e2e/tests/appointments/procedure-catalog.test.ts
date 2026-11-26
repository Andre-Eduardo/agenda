import {expect, test} from '@fixtures/test';

test('schedules a procedure with defaults from the clinic catalog', async ({
    createAuthenticatedProfessional,
    createPatient,
    settingsPage,
    appointmentListPage,
}) => {
    const {clinicId} = await createAuthenticatedProfessional({additionalRoles: ['OWNER']});
    const patient = await createPatient({clinicId});
    const procedure = 'Avaliação de retorno';

    await settingsPage.navigate();
    await settingsPage.createProcedure(procedure, '50', '125,50');
    await expect(settingsPage.page.getByText(procedure, {exact: true})).toBeVisible();

    await appointmentListPage.navigate();
    await appointmentListPage.startNewAppointment(patient.name);

    const page = appointmentListPage.page;
    const dialog = page.getByRole('dialog', {name: 'Novo agendamento'});
    await dialog.getByRole('combobox', {name: 'Procedimento ou serviço', exact: true}).click();
    await page.getByRole('option', {name: procedure, exact: true}).click();

    await expect(dialog.getByLabel('Duração (min)', {exact: true})).toHaveValue('50');
    await expect(dialog.getByLabel('Valor (R$)', {exact: true})).toHaveValue('125.50');
    await expect(dialog.getByRole('combobox', {name: 'Cor', exact: true})).toHaveText('Verde');
    await expect(dialog.getByRole('combobox', {name: 'Modalidade', exact: true})).toHaveText('Remoto');

    await appointmentListPage.createSubmitButton.click();
    await expect(dialog).toBeHidden();

    const appointment = appointmentListPage.apptBlock(patient.name);
    await expect(appointment.getByRole('img', {name: 'Verde'})).toBeVisible();
    await appointmentListPage.openAppointment(patient.name);
    const details = page.getByRole('dialog');

    await expect(details.getByText(procedure, {exact: true})).toBeVisible();
    await expect(details.getByText('50 min', {exact: true})).toBeVisible();
    await expect(details.getByText('Remoto', {exact: true})).toBeVisible();
    const procedureDetails = details.getByRole('group', {name: 'Procedimento ou serviço'});
    await expect(procedureDetails.getByText(/R\$\s*125,50/)).toBeVisible();
});
