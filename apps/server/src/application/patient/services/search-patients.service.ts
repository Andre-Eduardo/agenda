import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {PaginatedDto} from '@application/@shared/dto';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {PatientDto, SearchPatientsDto} from '@application/patient/dtos';
import {PatientRepository} from '@domain/patient/patient.repository';

@Injectable()
export class SearchPatientsService implements ApplicationService<SearchPatientsDto, PaginatedDto<PatientDto>> {
    constructor(
        private readonly patientRepository: PatientRepository,
        private readonly patientAccessChecker: PatientAccessChecker
    ) {}

    async execute({actor, payload}: Command<SearchPatientsDto>): Promise<PaginatedDto<PatientDto>> {
        const {term, sort, ...rest} = payload;
        const ids = await this.patientAccessChecker.patientIdsForAction(actor, 'basic');

        if (ids !== null && ids.length === 0) return {data: [], totalCount: 0};

        const result = await this.patientRepository.search(
            {
                ...rest,
                sort: sort ?? undefined,
            },
            {
                term: term ?? undefined,
                clinicId: actor.clinicId ?? undefined,
                ids: ids ?? undefined,
            }
        );

        return {
            data: result.data.map((patient) => new PatientDto(patient)),
            totalCount: result.totalCount,
        };
    }
}
