import {test} from '@fixtures/test';

// "Prontuário & Evolução" scenarios from mvp-features.html that go beyond the plain SOAP
// create/view flow already covered in e2e/tests/records/*.test.ts.

test.describe('Assinatura e bloqueio da evolução', () => {
    // Feature not implemented in the frontend: records/pages/records/detail already reads
    // record.isLocked to render a "signedBadge" vs "draftBadge" (index.tsx:408), but there is
    // no "Assinar" button wired to SignRecordService (POST /records/:id/sign), no "Reabrir"
    // action for ReopenRecordService, and no view of the RecordAmendment audit trail.
    //
    // test('should let a professional sign a record, locking it from further edits', async ({
    //     createPatient,
    //     recordNewPage,
    //     recordDetailPage,
    //     page,
    // }) => {
    //     const patient = await createPatient({clinicId});
    //     await recordNewPage.navigate(patient.id);
    //     await recordNewPage.fillSoap({subjective: 'Consulta de rotina.'});
    //     await recordNewPage.publish();
    //     await page.getByRole('button', {name: /^assinar$/i}).click();
    //     await expect(page.getByText(/evolução assinada/i)).toBeVisible();
    // });
    //
    // test('should let a professional reopen a signed record and record an amendment', async ({
    //     recordDetailPage,
    //     page,
    // }) => {
    //     await page.getByRole('button', {name: /^reabrir$/i}).click();
    //     await page.getByLabel(/motivo da reabertura/i).fill('Correção de dosagem prescrita.');
    //     await page.getByRole('button', {name: /confirmar reabertura/i}).click();
    //     await expect(page.getByText(/registro reaberto/i)).toBeVisible();
    // });
});

test.describe('Pré-evolução gerada por IA (revisável)', () => {
    // Feature not implemented in the frontend: DraftEvolution (status DRAFT/PENDING_REVIEW/
    // APPROVED/REJECTED, overallConfidence) is created and updated via
    // GetOrCreateDraftService/UpdateDraftService/ApproveDraftService and exposed through
    // ImportedDocumentController, but there is no review screen — a professional cannot see
    // an AI-suggested draft, edit it, or approve it into a Record with wasHumanEdited=true.
    //
    // test('should let a professional review and approve an AI-generated draft evolution', async ({
    //     createPatient,
    //     page,
    // }) => {
    //     const patient = await createPatient({clinicId});
    //     await page.goto(`/patients/${patient.id}/records/draft`);
    //     await expect(page.getByText(/pré-evolução gerada por ia/i)).toBeVisible();
    //     await page.getByRole('button', {name: /aprovar rascunho/i}).click();
    //     await expect(page.getByText(/evolução criada a partir do rascunho/i)).toBeVisible();
    // });
});
