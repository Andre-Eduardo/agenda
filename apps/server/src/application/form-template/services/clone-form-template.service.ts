import {Injectable} from '@nestjs/common';
import {FormTemplate} from '../../../domain/form-template/entities';
import {FormTemplateId} from '../../../domain/form-template/entities';
import {FormTemplateRepository} from '../../../domain/form-template/form-template.repository';
import {FormTemplateVersionRepository} from '../../../domain/form-template-version/form-template-version.repository';
import {FormTemplateVersion, FormStatus} from '../../../domain/form-template-version/entities';
import {ProfessionalId} from '../../../domain/professional/entities';
import {ResourceNotFoundException, PreconditionException} from '../../../domain/@shared/exceptions';
import {ApplicationService, Command} from '../../@shared/application.service';
import {FormTemplateDto} from '../dtos';

export type CloneFormTemplateDto = {
    templateId: FormTemplateId;
    professionalId: ProfessionalId;
    code: string;
    name?: string;
};

@Injectable()
export class CloneFormTemplateService implements ApplicationService<CloneFormTemplateDto, FormTemplateDto> {
    constructor(
        private readonly formTemplateRepository: FormTemplateRepository,
        private readonly formTemplateVersionRepository: FormTemplateVersionRepository
    ) {}

    async execute({payload}: Command<CloneFormTemplateDto>): Promise<FormTemplateDto> {
        const source = await this.formTemplateRepository.findById(payload.templateId);
        if (!source) {
            throw new ResourceNotFoundException('Source form template not found.', 'FormTemplate');
        }
        if (!source.isPublic && source.professionalId?.toString() !== payload.professionalId.toString()) {
            throw new PreconditionException('Only public templates can be cloned.');
        }

        const existingCode = await this.formTemplateRepository.findByCode(payload.code);
        if (existingCode) {
            throw new PreconditionException(`A template with code "${payload.code}" already exists.`);
        }

        const cloned = FormTemplate.create({
            code: payload.code,
            name: payload.name ?? `${source.name} (cópia)`,
            description: source.description,
            specialty: source.specialty,
            isPublic: false,
            professionalId: payload.professionalId,
        });

        await this.formTemplateRepository.save(cloned);

        // Clone the latest published version if it exists
        const sourceVersion = await this.formTemplateVersionRepository.findLatestPublished(source.id);
        if (sourceVersion) {
            const clonedVersion = FormTemplateVersion.create({
                templateId: cloned.id,
                versionNumber: 1,
                status: FormStatus.DRAFT,
                definitionJson: sourceVersion.definitionJson,
                schemaJson: sourceVersion.schemaJson,
            });
            await this.formTemplateVersionRepository.save(clonedVersion);
        }

        return new FormTemplateDto(cloned);
    }
}
