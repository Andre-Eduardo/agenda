import {expect, test} from '@fixtures/test';

test('shows the same procedure revenue in the agenda and financial report', async ({
    createAuthenticatedProfessional,
    createPatient,
    settingsPage,
    appointmentListPage,
}) => {
    const {clinicId} = await createAuthenticatedProfessional({additionalRoles: ['OWNER']});
    const patient = await createPatient({clinicId});
    const procedure = 'Avaliação financeira';

    await settingsPage.navigate();
    await settingsPage.createProcedure(procedure, '50', '125,50');

    await appointmentListPage.navigate();
    await appointmentListPage.startNewAppointment(patient.name);

    const {page} = appointmentListPage;
    const scheduling = page.getByRole('dialog', {name: 'Novo agendamento'});
    await scheduling.getByRole('combobox', {name: 'Procedimento ou serviço'}).click();
    await page.getByRole('option', {name: procedure, exact: true}).click();
    await appointmentListPage.createSubmitButton.click();
    await expect(scheduling).toBeHidden();

    await appointmentListPage.openAppointment(patient.name);
    const detail = page.getByRole('dialog').getByRole('group', {name: 'Pagamento'});
    await expect(detail.getByText('A definir', {exact: true})).toBeVisible();
    await detail.getByRole('button', {name: 'Registrar pagamento', exact: true}).click();
    await expect(detail.getByLabel('Valor (R$)', {exact: true})).toHaveValue('125.50');
    await detail.getByRole('button', {name: 'Registrar pagamento', exact: true}).click();
    await expect(detail.getByText('Pix', {exact: true})).toBeVisible();
    await expect(detail.getByText('Pago', {exact: true})).toBeVisible();
    await expect(detail.getByText(/R\$\s*125,50/)).toHaveCount(2);
    await expect(detail.getByText(/R\$\s*0,00/)).toHaveCount(1);

    await page.goto('/financial');
    const row = page.getByRole('row').filter({hasText: patient.name});
    await expect(row.getByRole('cell', {name: procedure})).toBeVisible();
    await expect(row.getByRole('cell', {name: 'Pix', exact: true})).toBeVisible();
    await expect(row.getByRole('cell', {name: /R\$\s*125,50/})).toHaveCount(2);
    await expect(row.getByRole('cell', {name: /R\$\s*0,00/})).toHaveCount(1);
});
