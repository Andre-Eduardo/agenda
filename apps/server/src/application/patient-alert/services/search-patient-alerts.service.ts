import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {PaginatedDto} from '@application/@shared/dto';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {PatientAlertDto, SearchPatientAlertsQueryDto} from '@application/patient-alert/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {PatientAlertRepository} from '@domain/patient-alert/patient-alert.repository';
import {PatientId} from '@domain/patient/entities';
import {PatientRepository} from '@domain/patient/patient.repository';

type SearchWithPatientDto = SearchPatientAlertsQueryDto & {patientId: PatientId};

@Injectable()
export class SearchPatientAlertsService implements ApplicationService<
    SearchWithPatientDto,
    PaginatedDto<PatientAlertDto>
> {
    constructor(
        private readonly patientAlertRepository: PatientAlertRepository,
        private readonly patientRepository: PatientRepository,
        private readonly patientAccessChecker: PatientAccessChecker
    ) {}

    async execute({actor, payload}: Command<SearchWithPatientDto>): Promise<PaginatedDto<PatientAlertDto>> {
        const patient = await this.patientRepository.findById(payload.patientId);

        if (patient === null) {
            throw new ResourceNotFoundException('Patient not found.', payload.patientId.toString());
        }

        assertEntityBelongsToClinic(patient.clinicId, actor.clinicId);
        await this.patientAccessChecker.assertCanAccess(actor, payload.patientId, 'read');

        const {sort, isActive, severity, patientId, ...rest} = payload;

        const result = await this.patientAlertRepository.search(
            {
                ...rest,
                sort: sort ?? undefined,
            },
            {
                clinicId: actor.clinicId,
                patientId,
                severity,
                isActive: isActive === undefined ? undefined : isActive === 'true',
            }
        );

        return {
            data: result.data.map((alert) => new PatientAlertDto(alert)),
            totalCount: result.totalCount,
        };
    }
}
