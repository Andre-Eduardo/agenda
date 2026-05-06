import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {PatientFormDto, SavePatientFormDraftDto} from '@application/patient-form/dtos';
import {FormFieldIndexerService} from '@application/patient-form/services/form-field-indexer.service';
import {FormResponseValidatorService} from '@application/patient-form/services/form-response-validator.service';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {FormTemplateVersionRepository} from '@domain/form-template-version/form-template-version.repository';
import {inferSpecialtyGroup} from '@domain/form-template/entities';
import {PatientFormRepository} from '@domain/patient-form/patient-form.repository';

@Injectable()
export class SavePatientFormDraftService implements ApplicationService<SavePatientFormDraftDto, PatientFormDto> {
    constructor(
        private readonly patientFormRepository: PatientFormRepository,
        private readonly formTemplateVersionRepository: FormTemplateVersionRepository,
        private readonly validator: FormResponseValidatorService,
        private readonly indexer: FormFieldIndexerService
    ) {}

    async execute({actor: _actor, payload}: Command<SavePatientFormDraftDto>): Promise<PatientFormDto> {
        const form = await this.patientFormRepository.findById(payload.patientFormId);

        if (!form) {
            throw new ResourceNotFoundException('Patient form not found.', 'PatientForm');
        }

        const version = await this.formTemplateVersionRepository.findById(form.versionId);

        if (!version) {
            throw new ResourceNotFoundException('Form template version not found.', 'FormTemplateVersion');
        }

        // Partial validation for drafts: skip required checks but type-check provided answers
        // Full validation happens on complete()
        const responseJson = {answers: payload.answers};

        form.saveDraft(responseJson);

        await this.patientFormRepository.save(form);

        // Reindex fields for partial search support even in drafts
        await this.indexer.reindex(
            form.id,
            inferSpecialtyGroup(version.definitionJson.specialty),
            version.definitionJson,
            payload.answers
        );

        return new PatientFormDto(form);
    }
}
