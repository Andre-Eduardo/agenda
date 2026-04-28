import {Injectable} from '@nestjs/common';
import {FormFieldIndex} from '../../../domain/form-field-index/entities';
import {FormFieldIndexRepository} from '../../../domain/form-field-index/form-field-index.repository';
import {PatientFormId} from '../../../domain/patient-form/entities';
import {AiSpecialtyGroup} from '../../../domain/form-template/entities';
import type {FormDefinitionJson, FormAnswer} from '../../../domain/form-template/types';

@Injectable()
export class FormFieldIndexerService {
    constructor(private readonly formFieldIndexRepository: FormFieldIndexRepository) {}

    async reindex(
        patientFormId: PatientFormId,
        specialtyGroup: AiSpecialtyGroup | null,
        definition: FormDefinitionJson,
        answers: FormAnswer[]
    ): Promise<void> {
        await this.formFieldIndexRepository.deleteByPatientForm(patientFormId);

        const allFields = definition.sections.flatMap((s) => s.fields);
        const answerMap = new Map(answers.map((a) => [a.fieldId, a]));
        const entries: FormFieldIndex[] = [];

        for (const field of allFields) {
            const answer = answerMap.get(field.id);
            if (!answer) continue;

            const entry = FormFieldIndex.create({
                patientFormId,
                fieldId: field.id,
                fieldLabel: field.label,
                fieldType: field.type,
                valueText: answer.valueText ?? null,
                valueNumber: answer.valueNumber ?? null,
                valueBoolean: answer.valueBoolean ?? null,
                valueDate: answer.valueDate ? new Date(answer.valueDate) : null,
                valueJson: answer.valueJson ?? null,
                specialtyGroup,
                confidence: null,
            });

            entries.push(entry);
        }

        await this.formFieldIndexRepository.saveMany(entries);
    }

    async search(filter: {
        patientFormId?: PatientFormId;
        fieldId?: string;
        specialtyGroup?: AiSpecialtyGroup;
    }): Promise<FormFieldIndex[]> {
        return this.formFieldIndexRepository.search(filter);
    }
}
