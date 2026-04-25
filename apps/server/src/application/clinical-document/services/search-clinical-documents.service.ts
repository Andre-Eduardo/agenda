import {Injectable} from '@nestjs/common';
import {ClinicalDocumentRepository} from '../../../domain/clinical-document/clinical-document.repository';
import {PaginatedDto} from '../../@shared/dto';
import {ApplicationService, Command} from '../../@shared/application.service';
import {ClinicalDocumentDto, SearchClinicalDocumentsDto} from '../dtos';
import type {PatientId} from '../../../domain/patient/entities';

type SearchWithClinicDto = SearchClinicalDocumentsDto & {patientId?: PatientId};

@Injectable()
export class SearchClinicalDocumentsService
    implements ApplicationService<SearchWithClinicDto, PaginatedDto<ClinicalDocumentDto>>
{
    constructor(private readonly clinicalDocumentRepository: ClinicalDocumentRepository) {}

    async execute({actor, payload}: Command<SearchWithClinicDto>): Promise<PaginatedDto<ClinicalDocumentDto>> {
        const result = await this.clinicalDocumentRepository.search(
            {
                limit: payload.limit,
                page: payload.page,
            },
            {
                clinicId: actor.clinicId,
                patientId: payload.patientId,
                type: payload.type ?? undefined,
                status: payload.status ?? undefined,
            },
        );

        return {
            data: result.data.map((doc) => new ClinicalDocumentDto(doc)),
            totalCount: result.totalCount,
        };
    }
}
