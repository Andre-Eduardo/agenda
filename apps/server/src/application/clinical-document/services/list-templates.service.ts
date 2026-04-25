import {Injectable} from '@nestjs/common';
import {ClinicId} from '../../../domain/clinic/entities';
import {ClinicalDocumentTemplateRepository} from '../../../domain/clinical-document/clinical-document-template.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {ClinicalDocumentTemplateDto} from '../dtos';

type ListTemplatesDto = {clinicId: ClinicId};

@Injectable()
export class ListTemplatesService implements ApplicationService<ListTemplatesDto, ClinicalDocumentTemplateDto[]> {
    constructor(private readonly clinicalDocumentTemplateRepository: ClinicalDocumentTemplateRepository) {}

    async execute({payload}: Command<ListTemplatesDto>): Promise<ClinicalDocumentTemplateDto[]> {
        const templates = await this.clinicalDocumentTemplateRepository.findAllByClinic(payload.clinicId);
        return templates.map((t) => new ClinicalDocumentTemplateDto(t));
    }
}
