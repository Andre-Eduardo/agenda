import {Injectable} from '@nestjs/common';
import {PatientId} from '../../../domain/patient/entities';
import {PatientRepository} from '../../../domain/patient/patient.repository';
import {PatientFormRepository} from '../../../domain/patient-form/patient-form.repository';
import {FormTemplateRepository} from '../../../domain/form-template/form-template.repository';
import {FormTemplateVersionRepository} from '../../../domain/form-template-version/form-template-version.repository';
import {FormFieldIndexRepository} from '../../../domain/form-field-index/form-field-index.repository';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import type {AiSpecialtyGroup} from '../../../domain/form-template/entities';
import type {PatientForm} from '../../../domain/patient-form/entities';
import {FormResponseStatus} from '../../../domain/patient-form/entities';
import type {FormFieldIndex} from '../../../domain/form-field-index/entities';

export type AiContextFilter = {
    specialty?: AiSpecialtyGroup;
    fromDate?: Date;
    toDate?: Date;
    onlyCompleted?: boolean;
};

export type AiFormEntry = {
    patientFormId: string;
    template: {
        id: string;
        code: string;
        name: string;
        versionNumber: number;
        specialty: string;
    };
    appliedAt: string;
    completedAt: string | null;
    status: string;
    answers: unknown[];
    computed: unknown | null;
    indexedFields: Array<{
        fieldId: string;
        fieldLabel: string | null;
        fieldType: string | null;
        value: unknown;
    }>;
};

export type AiContextPayload = {
    patient: {
        id: string;
        name: string | null;
        birthDate: string | null;
        documentId: string;
    };
    forms: AiFormEntry[];
    generatedAt: string;
};

@Injectable()
export class FormAiContextService {
    constructor(
        private readonly patientRepository: PatientRepository,
        private readonly patientFormRepository: PatientFormRepository,
        private readonly formTemplateRepository: FormTemplateRepository,
        private readonly formTemplateVersionRepository: FormTemplateVersionRepository,
        private readonly formFieldIndexRepository: FormFieldIndexRepository
    ) {}

    async buildForPatient(patientId: PatientId, filter: AiContextFilter = {}): Promise<AiContextPayload> {
        const patient = await this.patientRepository.findById(patientId);

        if (!patient) {
            throw new ResourceNotFoundException('Patient not found.', 'Patient');
        }

        const {data: forms} = await this.patientFormRepository.search(
            {limit: 200, sort: [{key: 'appliedAt', direction: 'desc'}]},
            {
                patientId,
                status: filter.onlyCompleted ? FormResponseStatus.COMPLETED : undefined,
                specialty: filter.specialty,
            }
        );

        const filteredForms = this.applyDateFilter(forms, filter);

        const formEntries = await Promise.all(filteredForms.map((form) => this.buildFormEntry(form)));

        return {
            patient: {
                id: patient.id.toString(),
                name: null, // Person name fetched via patient relation if needed
                birthDate: patient.birthDate?.toISOString() ?? null,
                documentId: patient.documentId.toString(),
            },
            forms: formEntries,
            generatedAt: new Date().toISOString(),
        };
    }

    /**
     * Compact timeline for LLM prompts — text-based summary.
     */
    async buildTextTimeline(patientId: PatientId, filter: AiContextFilter = {}): Promise<string> {
        const context = await this.buildForPatient(patientId, filter);
        const lines: string[] = [
            `Patient: ${context.patient.id}`,
            `Generated: ${context.generatedAt}`,
            '',
            '=== Clinical Forms Timeline ===',
        ];

        for (const form of context.forms) {
            lines.push(
                `\n[${form.appliedAt.slice(0, 10)}] ${form.template.name} (${form.template.specialty}) — ${form.status}`
            );

            if (form.computed) {
                lines.push(`  Computed: ${JSON.stringify(form.computed)}`);
            }

            for (const field of form.indexedFields) {
                const val = field.value !== null && field.value !== undefined ? JSON.stringify(field.value) : '—';

                lines.push(`  ${field.fieldLabel ?? field.fieldId}: ${val}`);
            }
        }

        return lines.join('\n');
    }

    private applyDateFilter(forms: PatientForm[], filter: AiContextFilter): PatientForm[] {
        return forms.filter((f) => {
            if (filter.fromDate && f.appliedAt < filter.fromDate) return false;

            if (filter.toDate && f.appliedAt > filter.toDate) return false;

            return true;
        });
    }

    private async buildFormEntry(form: PatientForm): Promise<AiFormEntry> {
        const [version, indexedFields] = await Promise.all([
            this.formTemplateVersionRepository.findById(form.versionId),
            this.formFieldIndexRepository.listByPatientForm(form.id),
        ]);

        const template = await this.formTemplateRepository.findById(form.templateId);

        return {
            patientFormId: form.id.toString(),
            template: {
                id: form.templateId.toString(),
                code: template?.code ?? '',
                name: template?.name ?? '',
                versionNumber: version?.versionNumber ?? 0,
                specialty: template?.specialtyLabel ?? '',
            },
            appliedAt: form.appliedAt.toISOString(),
            completedAt: form.completedAt?.toISOString() ?? null,
            status: form.status,
            answers: form.responseJson.answers,
            computed: form.computedJson,
            indexedFields: this.mapIndexedFields(indexedFields),
        };
    }

    private mapIndexedFields(
        entries: FormFieldIndex[]
    ): AiFormEntry['indexedFields'] {
        return entries.map((e) => ({
            fieldId: e.fieldId,
            fieldLabel: e.fieldLabel,
            fieldType: e.fieldType,
            value:
                e.valueText ??
                e.valueNumber ??
                e.valueBoolean ??
                e.valueDate ??
                e.valueJson ??
                null,
        }));
    }
}
