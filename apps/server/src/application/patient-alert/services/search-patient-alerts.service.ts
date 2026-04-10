import {Injectable} from '@nestjs/common';
import {PatientId} from '../../../domain/patient/entities';
import {PatientAlertRepository} from '../../../domain/patient-alert/patient-alert.repository';
import {PaginatedDto} from '../../@shared/dto';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PatientAlertDto, SearchPatientAlertsDto} from '../dtos';

type SearchWithPatientDto = SearchPatientAlertsDto & {patientId: PatientId};

@Injectable()
export class SearchPatientAlertsService implements ApplicationService<SearchWithPatientDto, PaginatedDto<PatientAlertDto>> {
    constructor(private readonly patientAlertRepository: PatientAlertRepository) {}

    async execute({payload}: Command<SearchWithPatientDto>): Promise<PaginatedDto<PatientAlertDto>> {
        const {sort, isActive, patientId, ...rest} = payload;

        const result = await this.patientAlertRepository.search(
            {
                ...rest,
                sort: sort ? (Object.entries(sort) as [keyof typeof sort, 'asc' | 'desc'][]).map(([key, direction]) => ({key, direction})) : undefined,
            },
            {
                patientId,
                isActive: isActive ?? undefined,
            }
        );

        return {
            data: result.data.map((alert) => new PatientAlertDto(alert)),
            totalCount: result.totalCount,
        };
    }
}
