import {Injectable} from '@nestjs/common';
import {PatientRepository} from '../../../domain/patient/patient.repository';
import {PaginatedDto} from '../../@shared/dto';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PatientDto, SearchPatientsDto} from '../dtos';

@Injectable()
export class SearchPatientsService implements ApplicationService<SearchPatientsDto, PaginatedDto<PatientDto>> {
    constructor(private readonly patientRepository: PatientRepository) {}

    async execute({payload}: Command<SearchPatientsDto>): Promise<PaginatedDto<PatientDto>> {
        const {term, sort, ...rest} = payload;

        const result = await this.patientRepository.search(
            {
                ...rest,
                sort: sort ? (Object.entries(sort) as [keyof typeof sort, 'asc' | 'desc'][]).map(([key, direction]) => ({key, direction})) : undefined,
            },
            {term: term ?? undefined}
        );

        return {
            data: result.data.map((patient) => new PatientDto(patient)),
            totalCount: result.totalCount,
        };
    }
}
