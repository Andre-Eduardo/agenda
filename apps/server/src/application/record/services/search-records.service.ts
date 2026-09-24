import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {PaginatedDto} from '@application/@shared/dto';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {RecordDto, SearchRecordsDto} from '@application/record/dtos';
import {AccessDeniedException, AccessDeniedReason, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {PatientRepository} from '@domain/patient/patient.repository';
import {RecordRepository} from '@domain/record/record.repository';

@Injectable()
export class SearchRecordsService implements ApplicationService<SearchRecordsDto, PaginatedDto<RecordDto>> {
    constructor(
        private readonly recordRepository: RecordRepository,
        private readonly patientRepository: PatientRepository,
        private readonly patientAccessChecker: PatientAccessChecker
    ) {}

    async execute({actor, payload}: Command<SearchRecordsDto>): Promise<PaginatedDto<RecordDto>> {
        const {term, sort, patientId, attendanceType, clinicalStatus, dateStart, dateEnd, source, ...rest} = payload;

        if (patientId) {
            const patient = await this.patientRepository.findById(patientId);

            if (patient === null) throw new ResourceNotFoundException('Patient not found.', patientId.toString());
            assertEntityBelongsToClinic(patient.clinicId, actor.clinicId);
        }

        const visibility = await this.patientAccessChecker.recordVisibility(actor);

        if (
            patientId &&
            visibility !== null &&
            !visibility.patientIds.some((id) => id.equals(patientId)) &&
            visibility.allowedRecordIds.length === 0
        ) {
            throw new AccessDeniedException('Patient access denied.', AccessDeniedReason.NOT_ALLOWED);
        }

        if (visibility !== null && visibility.patientIds.length === 0 && visibility.allowedRecordIds.length === 0) {
            return {data: [], totalCount: 0};
        }

        const result = await this.recordRepository.search(
            {
                ...rest,
                sort: sort ?? undefined,
            },
            {
                term: term ?? undefined,
                patientId: patientId ?? undefined,
                accessPatientIds: visibility?.patientIds,
                allowedRecordIds: visibility?.allowedRecordIds,
                deniedRecordIds: visibility?.deniedRecordIds,
                clinicId: actor.clinicId ?? undefined,
                attendanceType: attendanceType ?? undefined,
                clinicalStatus: clinicalStatus ?? undefined,
                dateStart: dateStart ?? undefined,
                dateEnd: dateEnd ?? undefined,
                source: source ?? undefined,
            }
        );

        return {
            data: result.data.map((record) => new RecordDto(record)),
            totalCount: result.totalCount,
        };
    }
}
