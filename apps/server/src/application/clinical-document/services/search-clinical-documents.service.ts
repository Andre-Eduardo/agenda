import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {PaginatedDto} from '@application/@shared/dto';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {ClinicalDocumentDto, SearchClinicalDocumentsDto} from '@application/clinical-document/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {ClinicalDocumentRepository} from '@domain/clinical-document/clinical-document.repository';
import type {PatientId} from '@domain/patient/entities';
import {PatientRepository} from '@domain/patient/patient.repository';

type SearchWithClinicDto = SearchClinicalDocumentsDto & {patientId?: PatientId};

@Injectable()
export class SearchClinicalDocumentsService implements ApplicationService<
    SearchWithClinicDto,
    PaginatedDto<ClinicalDocumentDto>
> {
    constructor(
        private readonly clinicalDocumentRepository: ClinicalDocumentRepository,
        private readonly patientRepository: PatientRepository,
        private readonly patientAccessChecker: PatientAccessChecker
    ) {}

    async execute({actor, payload}: Command<SearchWithClinicDto>): Promise<PaginatedDto<ClinicalDocumentDto>> {
        if (payload.patientId) {
            const patient = await this.patientRepository.findById(payload.patientId);

            if (patient === null)
                throw new ResourceNotFoundException('Patient not found.', payload.patientId.toString());

            assertEntityBelongsToClinic(patient.clinicId, actor.clinicId);
            await this.patientAccessChecker.assertCanAccess(actor, payload.patientId, 'read');
        }

        const patientIds = payload.patientId ? null : await this.patientAccessChecker.readablePatientIds(actor);

        if (patientIds !== null && patientIds.length === 0) return {data: [], totalCount: 0};

        const result = await this.clinicalDocumentRepository.search(
            {
                limit: payload.limit,
                page: payload.page,
            },
            {
                clinicId: actor.clinicId,
                patientId: payload.patientId,
                patientIds: patientIds ?? undefined,
                type: payload.type ?? undefined,
                status: payload.status ?? undefined,
            }
        );

        return {
            data: result.data.map((doc) => new ClinicalDocumentDto(doc)),
            totalCount: result.totalCount,
        };
    }
}
