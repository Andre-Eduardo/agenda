import {Injectable} from '@nestjs/common';
import {PatientForm} from '../../../domain/patient-form/entities';
import {PatientFormRepository} from '../../../domain/patient-form/patient-form.repository';
import {FormTemplateRepository} from '../../../domain/form-template/form-template.repository';
import {FormTemplateVersionRepository} from '../../../domain/form-template-version/form-template-version.repository';
import {ResourceNotFoundException, PreconditionException} from '../../../domain/@shared/exceptions';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PatientFormDto, StartPatientFormDto} from '../dtos';

@Injectable()
export class StartPatientFormService implements ApplicationService<StartPatientFormDto, PatientFormDto> {
    constructor(
        private readonly patientFormRepository: PatientFormRepository,
        private readonly formTemplateRepository: FormTemplateRepository,
        private readonly formTemplateVersionRepository: FormTemplateVersionRepository
    ) {}

    async execute({actor, payload}: Command<StartPatientFormDto>): Promise<PatientFormDto> {
        const template = await this.formTemplateRepository.findById(payload.templateId);
        if (!template) {
            throw new ResourceNotFoundException('Form template not found.', 'FormTemplate');
        }

        let version;
        if (payload.versionId) {
            version = await this.formTemplateVersionRepository.findById(payload.versionId);
        } else {
            version = await this.formTemplateVersionRepository.findLatestPublished(template.id);
        }

        if (!version) {
            throw new PreconditionException('No published version found for this template. Publish a version first.');
        }

        if (!version.isPublished() && !payload.versionId) {
            throw new PreconditionException('The selected version is not published.');
        }

        const form = PatientForm.create({
            patientId: payload.patientId,
            professionalId: payload.professionalId,
            templateId: template.id,
            versionId: version.id,
            responseJson: {answers: []},
            appliedAt: payload.appliedAt ?? new Date(),
        });

        await this.patientFormRepository.save(form);

        return new PatientFormDto(form);
    }
}
