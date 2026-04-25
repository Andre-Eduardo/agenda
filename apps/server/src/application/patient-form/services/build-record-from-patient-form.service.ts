import {Injectable} from '@nestjs/common';
import {PatientFormId, FormResponseStatus} from '../../../domain/patient-form/entities';
import {PatientFormRepository} from '../../../domain/patient-form/patient-form.repository';
import {FormTemplateVersionRepository} from '../../../domain/form-template-version/form-template-version.repository';
import {ResourceNotFoundException, PreconditionException} from '../../../domain/@shared/exceptions';

export type RecordPayloadFromForm = {
    title: string;
    freeNotes: string;
    assessment?: string;
    plan?: string;
    patientFormId: string;
    patientId: string;
    /**
     * Professional clinically responsible. Null if the form was applied by a
     * non-professional member (typical for intake/secretary-applied forms);
     * caller must assign a responsible professional before persisting a Record.
     */
    responsibleProfessionalId: string | null;
};

/**
 * Builds a Record payload from a completed PatientForm.
 * Does NOT persist anything — caller decides what to do with the payload.
 * Integration point for future automation or user-triggered linking.
 */
@Injectable()
export class BuildRecordFromPatientFormService {
    constructor(
        private readonly patientFormRepository: PatientFormRepository,
        private readonly formTemplateVersionRepository: FormTemplateVersionRepository
    ) {}

    async execute(patientFormId: PatientFormId): Promise<RecordPayloadFromForm> {
        const form = await this.patientFormRepository.findById(patientFormId);
        if (!form) {
            throw new ResourceNotFoundException('Patient form not found.', 'PatientForm');
        }

        if (form.status !== FormResponseStatus.COMPLETED) {
            throw new PreconditionException('Only completed forms can generate a Record payload.');
        }

        const version = await this.formTemplateVersionRepository.findById(form.versionId);
        const formName = version?.definitionJson.name ?? 'Clinical Form';

        const freeNotes = this.buildFreeNotes(form.responseJson.answers, version?.definitionJson);

        const assessment = form.computedJson?.classification
            ? `Classification: ${form.computedJson.classification}`
            : undefined;

        const plan = form.computedJson?.flags?.length
            ? `Flags: ${form.computedJson.flags.join(', ')}`
            : undefined;

        return {
            title: `${formName} — ${form.appliedAt.toLocaleDateString('pt-BR')}`,
            freeNotes,
            assessment,
            plan,
            patientFormId: form.id.toString(),
            patientId: form.patientId.toString(),
            responsibleProfessionalId: form.responsibleProfessionalId?.toString() ?? null,
        };
    }

    private buildFreeNotes(
        answers: Array<{fieldId: string; valueText?: string | null; valueNumber?: number | null; valueBoolean?: boolean | null}>,
        definition?: {sections: Array<{fields: Array<{id: string; label: string}>}>}
    ): string {
        if (!definition) return JSON.stringify(answers, null, 2);

        const fieldLabelMap = new Map(
            definition.sections.flatMap((s) => s.fields.map((f) => [f.id, f.label]))
        );

        return answers
            .map((a) => {
                const label = fieldLabelMap.get(a.fieldId) ?? a.fieldId;
                const value = a.valueText ?? a.valueNumber ?? a.valueBoolean ?? '—';
                return `${label}: ${value}`;
            })
            .join('\n');
    }
}
