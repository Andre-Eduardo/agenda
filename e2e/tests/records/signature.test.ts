import {expect, test} from '@fixtures/test';

test('signs, reopens and signs an edited clinical note again', async ({
    createAuthenticatedProfessional,
    createPatient,
    recordNewPage,
    patientDetailPage,
    recordDetailPage,
}) => {
    const {clinicId} = await createAuthenticatedProfessional();
    const patient = await createPatient({clinicId});
    const note = 'Descrição clínica original';
    const corrected = 'Descrição clínica corrigida';
    const reason = 'Correção da descrição inicial';

    await recordNewPage.navigate(patient.id);
    await recordNewPage.fillSoap({subjective: note});
    await recordNewPage.publish();
    await patientDetailPage.openFirstRecord();
    await recordDetailPage.verifyContent(note);

    const {page} = recordDetailPage;
    const editButton = page.getByRole('button', {name: 'Editar evolução', exact: true});
    await recordDetailPage.sign();
    await expect(editButton).toBeHidden();

    await page.getByRole('button', {name: 'Reabrir evolução', exact: true}).click();
    const reopen = page.getByRole('dialog', {name: 'Reabrir evolução'});
    const confirmReopen = reopen.getByRole('button', {name: 'Confirmar reabertura'});
    await confirmReopen.click();
    await expect(reopen.getByRole('alert')).toContainText('Informe um motivo');

    await reopen.getByLabel('Motivo da reabertura').fill(reason);
    await confirmReopen.click();
    await expect(page.getByText('Reaberta para edição', {exact: true})).toBeVisible();

    const history = page.getByRole('region', {name: 'Histórico de emendas'});
    await expect(history.getByText(reason, {exact: true})).toBeVisible();

    await editButton.click();
    const edit = page.getByRole('dialog', {name: 'Editar evolução'});
    await edit.getByLabel('Subjetivo', {exact: true}).fill(corrected);
    await edit.getByRole('button', {name: 'Salvar', exact: true}).click();
    await recordDetailPage.verifyContent(corrected);

    await recordDetailPage.sign();
    await expect(editButton).toBeHidden();
    await expect(history.getByText('Assinada novamente em', {exact: false})).toBeVisible();
});
