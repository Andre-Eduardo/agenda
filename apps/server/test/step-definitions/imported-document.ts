import {Given} from '@cucumber/cucumber';
import {randomUUID} from 'crypto';
import type {Context} from '../support/context';

/**
 * Seeds an ImportedDocument (with a placeholder File record) directly in the
 * database so that the draft-evolution and imported-document features can test
 * GET /draft, PATCH /draft and POST /approve without needing a real OCR pipeline.
 *
 * Both the File and the ImportedDocument are created via this.prisma.
 * The ImportedDocument ID is stored as `${ref:id:importedDocument:<draftKey>}`.
 *
 * Example:
 *   Given an imported document exists for patient "sign_patient" as "doc1"
 */
Given(
    'an imported document exists for patient {string} as {string}',
    async function (this: Context, patientKey: string, docKey: string) {
        const patientId = this.getVariableId('patient', patientKey);
        const clinicId = this.getVariableId('clinic', 'dr_house');
        const memberId = this.getVariableId('clinicMember', 'dr_house');

        const now = new Date();

        // Create a placeholder File record required by ImportedDocument.fileId
        const fileId = randomUUID();

        await this.prisma.file.create({
            data: {
                id: fileId,
                clinicId,
                createdByMemberId: memberId,
                fileName: `imported_${docKey}.pdf`,
                url: `/uploads/imported_${docKey}.pdf`,
                description: 'Documento importado para teste',
                createdAt: now,
                updatedAt: now,
            },
        });

        // Create the ImportedDocument in READY_FOR_REVIEW status
        const importedDocId = randomUUID();

        await this.prisma.importedDocument.create({
            data: {
                id: importedDocId,
                clinicId,
                createdByMemberId: memberId,
                patientId,
                fileId,
                documentType: 'MEDICAL_REPORT',
                rawOcrText: 'Paciente com diabetes mellitus tipo 2. Glicemia 280 mg/dL.',
                normalizedOcrText: 'Diabetes mellitus tipo 2. Glicemia 280.',
                status: 'READY_FOR_REVIEW',
                reviewRequired: true,
                createdAt: now,
                updatedAt: now,
            },
        });

        this.setVariableId('importedDocument', docKey, importedDocId);
    },
);
