import {Injectable} from '@nestjs/common';
import {z} from 'zod';
import {PatientId} from '../../../domain/patient/entities';
import {PatientFormRepository} from '../../../domain/patient-form/patient-form.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {searchPatientFormsSchema, PatientFormDto} from '../dtos';

export type SearchPatientFormsPayload = z.infer<typeof searchPatientFormsSchema> & {patientId: PatientId};

@Injectable()
export class SearchPatientFormsService
    implements ApplicationService<SearchPatientFormsPayload, PaginatedDto<PatientFormDto>>
{
    constructor(private readonly patientFormRepository: PatientFormRepository) {}

    async execute({actor, payload}: Command<SearchPatientFormsPayload>): Promise<PaginatedDto<PatientFormDto>> {
        const result = await this.patientFormRepository.search(
            {limit: payload.limit, sort: payload.sort as any},
            {
                patientId: payload.patientId,
                status: payload.status,
                specialty: payload.specialty,
            }
        );

        return {
            data: result.data.map((f) => new PatientFormDto(f)),
            totalCount: result.totalCount,
        };
    }
}
