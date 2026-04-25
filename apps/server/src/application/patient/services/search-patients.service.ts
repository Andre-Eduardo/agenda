import {Injectable} from '@nestjs/common';
import {Actor} from '../../../domain/@shared/actor';
import {PatientRepository} from '../../../domain/patient/patient.repository';
import {PaginatedDto} from '../../@shared/dto';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PatientDto, SearchPatientsDto} from '../dtos';

@Injectable()
export class SearchPatientsService implements ApplicationService<SearchPatientsDto, PaginatedDto<PatientDto>> {
    constructor(private readonly patientRepository: PatientRepository) {}

    async execute({actor, payload}: Command<SearchPatientsDto, Actor>): Promise<PaginatedDto<PatientDto>> {
        const {term, sort, ...rest} = payload;

        const result = await this.patientRepository.search(
            {
                ...rest,
                sort: sort ?? undefined,
            },
            {
                term: term ?? undefined,
                clinicId: actor.clinicId ?? undefined,
            }
        );

        return {
            data: result.data.map((patient) => new PatientDto(patient)),
            totalCount: result.totalCount,
        };
    }
}
