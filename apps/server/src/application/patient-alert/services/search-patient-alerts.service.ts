import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {PaginatedDto} from '@application/@shared/dto';
import {PatientAlertDto, SearchPatientAlertsDto} from '@application/patient-alert/dtos';
import {PatientAlertRepository} from '@domain/patient-alert/patient-alert.repository';
import {PatientId} from '@domain/patient/entities';

type SearchWithPatientDto = SearchPatientAlertsDto & {patientId: PatientId};

@Injectable()
export class SearchPatientAlertsService implements ApplicationService<
    SearchWithPatientDto,
    PaginatedDto<PatientAlertDto>
> {
    constructor(private readonly patientAlertRepository: PatientAlertRepository) {}

    async execute({payload}: Command<SearchWithPatientDto>): Promise<PaginatedDto<PatientAlertDto>> {
        const {sort, isActive, patientId, ...rest} = payload;

        const result = await this.patientAlertRepository.search(
            {
                ...rest,
                sort: sort ?? undefined,
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
