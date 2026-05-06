import {Injectable} from '@nestjs/common';
import {z} from 'zod';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {PaginatedDto} from '@application/@shared/dto';
import {searchPatientFormsSchema, PatientFormDto} from '@application/patient-form/dtos';
import {PatientFormRepository} from '@domain/patient-form/patient-form.repository';
import {PatientId} from '@domain/patient/entities';

export type SearchPatientFormsPayload = z.infer<typeof searchPatientFormsSchema> & {
    patientId: PatientId;
};

@Injectable()
export class SearchPatientFormsService implements ApplicationService<
    SearchPatientFormsPayload,
    PaginatedDto<PatientFormDto>
> {
    constructor(private readonly patientFormRepository: PatientFormRepository) {}

    async execute({actor: _actor, payload}: Command<SearchPatientFormsPayload>): Promise<PaginatedDto<PatientFormDto>> {
        const result = await this.patientFormRepository.search(
            {limit: payload.limit, sort: payload.sort},
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
