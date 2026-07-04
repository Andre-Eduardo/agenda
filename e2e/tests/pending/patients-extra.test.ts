import {test} from '@fixtures/test';

// Additional "Pacientes" module scenarios from mvp-features.html: the backend models are
// complete, but the corresponding create/edit UI is missing from patients/pages/new and
// patients/pages/edit, so these can only be verified as read-only display today
// (see e2e/tests/patients/view.test.ts for what already works).

test.describe('Convênio e plano de saúde do paciente', () => {
    // Feature incomplete: PatientEditPage reads patient.insurancePlanId back into the update
    // DTO unchanged (apps/web/src/views/modules/patients/pages/edit/index.tsx:438) but there
    // is no <Select> bound to it — a user cannot attach/change/remove an insurance plan from
    // the patient form. InsurancePlan CRUD also has no admin screen (ListInsurancePlansService
    // is only reachable via API).
    //
    // test('should let a user attach an insurance plan to a patient from the edit form', async ({
    //     createPatient,
    //     patientEditPage,
    //     page,
    // }) => {
    //     const patient = await createPatient({clinicId});
    //     await patientEditPage.navigate(patient.id);
    //     await patientEditPage.healthTab.click();
    //     await page.getByLabel(/convênio/i).selectOption({label: 'Unimed'});
    //     await patientEditPage.submitButton.click();
    //     await expect(page.getByText(/unimed/i)).toBeVisible();
    // });
});

test.describe('Perfil clínico do paciente (edição)', () => {
    // Feature incomplete: patients/pages/detail renders ClinicalProfile (allergies, chronic
    // conditions, medications) read-only via useGetClinicalProfile — there is no form to
    // create or edit it, so UpsertClinicalProfileService is never exercised from the UI.
    //
    // test('should let a professional record allergies and chronic conditions in the clinical profile', async ({
    //     createPatient,
    //     patientDetailPage,
    //     page,
    // }) => {
    //     const patient = await createPatient({clinicId});
    //     await patientDetailPage.navigate(patient.id);
    //     await page.getByRole('button', {name: /editar perfil clínico/i}).click();
    //     await page.getByLabel(/alergias conhecidas/i).fill('Penicilina');
    //     await page.getByRole('button', {name: /salvar/i}).click();
    //     await expect(page.getByText(/penicilina/i)).toBeVisible();
    // });
});

test.describe('Alertas do paciente (criação)', () => {
    // Feature incomplete: patient alerts are displayed as read-only badges on the detail page
    // (AlertBadge component, useSearchPatientAlerts) but there is no "Novo alerta" action to
    // create one with a severity (LOW/MEDIUM/HIGH), so PatientAlert CRUD is API-only today.
    //
    // test('should let a professional create a HIGH severity patient alert', async ({
    //     createPatient,
    //     patientDetailPage,
    //     page,
    // }) => {
    //     const patient = await createPatient({clinicId});
    //     await patientDetailPage.navigate(patient.id);
    //     await page.getByRole('button', {name: /novo alerta/i}).click();
    //     await page.getByLabel(/título/i).fill('Risco de queda');
    //     await page.getByLabel(/severidade/i).selectOption('HIGH');
    //     await page.getByRole('button', {name: /salvar alerta/i}).click();
    //     await expect(page.getByText(/risco de queda/i)).toBeVisible();
    // });
});

test.describe('Permissão granular por paciente e documento', () => {
    // Feature not implemented in the frontend: ClinicPatientAccess + DocumentPermission
    // overrides exist via DocumentPermissionController, but there is no screen to grant or
    // revoke per-document access for a specific clinic member.
    //
    // test('should let an OWNER restrict a specific document to one clinic member', async ({
    //     createPatient,
    //     patientDetailPage,
    //     page,
    // }) => {
    //     const patient = await createPatient({clinicId});
    //     await patientDetailPage.navigate(patient.id);
    //     await page.getByRole('tab', {name: /permissões/i}).click();
    //     await page.getByRole('button', {name: /restringir documento/i}).click();
    //     await expect(page.getByText(/permissão salva/i)).toBeVisible();
    // });
});
