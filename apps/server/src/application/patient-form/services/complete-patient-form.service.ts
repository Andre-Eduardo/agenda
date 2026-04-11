import {Injectable} from '@nestjs/common';
import {PatientFormRepository} from '../../../domain/patient-form/patient-form.repository';
import {FormTemplateVersionRepository} from '../../../domain/form-template-version/form-template-version.repository';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {ApplicationService, Command} from '../../@shared/application.service';
import {FormResponseValidatorService} from './form-response-validator.service';
import {FormScoringService} from './form-scoring.service';
import {FormFieldIndexerService} from './form-field-indexer.service';
import {CompletePatientFormDto, PatientFormDto} from '../dtos';
import type {Specialty} from '../../../domain/form-template/entities';

@Injectable()
export class CompletePatientFormService implements ApplicationService<CompletePatientFormDto, PatientFormDto> {
    constructor(
        private readonly patientFormRepository: PatientFormRepository,
        private readonly formTemplateVersionRepository: FormTemplateVersionRepository,
        private readonly validator: FormResponseValidatorService,
        private readonly scoring: FormScoringService,
        private readonly indexer: FormFieldIndexerService
    ) {}

    async execute({actor, payload}: Command<CompletePatientFormDto>): Promise<PatientFormDto> {
        const form = await this.patientFormRepository.findById(payload.patientFormId);
        if (!form) {
            throw new ResourceNotFoundException('Patient form not found.', 'PatientForm');
        }

        const version = await this.formTemplateVersionRepository.findById(form.versionId);
        if (!version) {
            throw new ResourceNotFoundException('Form template version not found.', 'FormTemplateVersion');
        }

        const responseJson = {answers: payload.answers};

        // Full validation — all required fields must be present and well-typed
        this.validator.validate({
            definition: version.definitionJson,
            answers: payload.answers,
        });

        // Compute scores and classifications
        const computedJson = this.scoring.compute(version.definitionJson, payload.answers);

        form.complete(responseJson, computedJson ?? undefined);

        await this.patientFormRepository.save(form);

        // Reindex all fields for search and analytics
        await this.indexer.reindex(
            form.id,
            version.definitionJson.specialty as Specialty,
            version.definitionJson,
            payload.answers
        );

        return new PatientFormDto(form);
    }
}
