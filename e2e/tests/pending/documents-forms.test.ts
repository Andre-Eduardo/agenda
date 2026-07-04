import {test} from '@fixtures/test';

// "Documentos & Formulários" module from mvp-features.html: backend entities are complete
// (File/UploadFile, ImportedDocument OCR pipeline, ExtractedField, FormTemplate,
// ClinicalDocument) but apps/web has no route consuming any of them.

test.describe('Upload de arquivos', () => {
    // Feature not implemented in the frontend: PrepareUploadService + PromoteFileService
    // back a file upload queue (FilePromotionStatus PENDING→IN_PROGRESS→READY/FAILED), but
    // there is no file picker anywhere in the app (patient detail, records) to attach a file.
    //
    // test('should let a professional upload a file to a patient record', async ({
    //     createPatient,
    //     patientDetailPage,
    //     page,
    // }) => {
    //     const patient = await createPatient({clinicId});
    //     await patientDetailPage.navigate(patient.id);
    //     await page.getByRole('button', {name: /anexar arquivo/i}).click();
    //     await page.getByLabel(/arquivo/i).setInputFiles('e2e/fixtures/sample-exam.pdf');
    //     await expect(page.getByText(/upload concluído/i)).toBeVisible();
    // });
});

test.describe('Pipeline de importação por OCR/IA', () => {
    // Feature not implemented in the frontend: ImportedDocument moves through 11 statuses
    // (UPLOADED→…→READY_FOR_REVIEW→APPROVED/REJECTED/FAILED) with qualityScore/ocrConfidence/
    // aiConfidence, and ExtractedField carries a per-field confidence score, but there is no
    // review UI to inspect extracted fields or approve/reject an imported document.
    //
    // test('should let a professional review low-confidence extracted fields before approving an imported document', async ({
    //     page,
    // }) => {
    //     await page.goto('/documents/imported');
    //     await page.getByRole('row', {name: /aguardando revisão/i}).click();
    //     await expect(page.getByText(/precisa de revisão/i)).toBeVisible();
    //     await page.getByRole('button', {name: /aprovar documento/i}).click();
    // });
});

test.describe('Formulários dinâmicos por especialidade', () => {
    // Feature not implemented in the frontend: FormTemplate/FormTemplateVersion (JSONB,
    // lifecycle DRAFT→PUBLISHED→DEPRECATED), PatientForm and CloneFormTemplateService have
    // full backend support, but there is no builder or fill-in screen in apps/web.
    //
    // test('should let a professional fill and submit a specialty-specific dynamic form for a patient', async ({
    //     createPatient,
    //     page,
    // }) => {
    //     const patient = await createPatient({clinicId});
    //     await page.goto(`/patients/${patient.id}/forms/new`);
    //     await page.getByLabel(/pressão arterial/i).fill('120/80');
    //     await page.getByRole('button', {name: /salvar formulário/i}).click();
    //     await expect(page.getByText(/formulário salvo/i)).toBeVisible();
    // });
});

test.describe('Geração de documentos clínicos (receita, atestado)', () => {
    // Feature not implemented in the frontend: GeneratePdfService renders PDFs for
    // PRESCRIPTION, PRESCRIPTION_SPECIAL, MEDICAL_CERTIFICATE, REFERRAL and EXAM_REQUEST via
    // ClinicalDocument/ClinicalDocumentTemplate, but there is no "Gerar documento" action
    // anywhere in the patient or record screens.
    //
    // test('should let a professional generate and download a medical certificate PDF for a patient', async ({
    //     createPatient,
    //     patientDetailPage,
    //     page,
    // }) => {
    //     const patient = await createPatient({clinicId});
    //     await patientDetailPage.navigate(patient.id);
    //     await page.getByRole('button', {name: /gerar documento/i}).click();
    //     await page.getByRole('option', {name: /atestado médico/i}).click();
    //     const downloadPromise = page.waitForEvent('download');
    //     await page.getByRole('button', {name: /gerar pdf/i}).click();
    //     const download = await downloadPromise;
    //     await expect(download.suggestedFilename()).toMatch(/atestado/i);
    // });
});
