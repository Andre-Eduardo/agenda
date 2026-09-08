import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {GetPatientPackageCreditHistoryDto, PatientPackageCreditDto} from '@application/patient-package/dtos';
import {PreconditionException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {PatientPackageCreditRepository} from '@domain/patient-package/patient-package-credit.repository';
import {PatientPackageRepository} from '@domain/patient-package/patient-package.repository';

@Injectable()
export class GetPatientPackageCreditHistoryService implements ApplicationService<
    GetPatientPackageCreditHistoryDto,
    PatientPackageCreditDto[]
> {
    constructor(
        private readonly patientPackageRepository: PatientPackageRepository,
        private readonly patientPackageCreditRepository: PatientPackageCreditRepository
    ) {}

    async execute({actor, payload}: Command<GetPatientPackageCreditHistoryDto>): Promise<PatientPackageCreditDto[]> {
        const patientPackage = await this.patientPackageRepository.findById(payload.id);

        if (patientPackage === null || !patientPackage.patientId.equals(payload.patientId)) {
            throw new ResourceNotFoundException('patient_package.not_found', payload.id.toString());
        }

        if (!patientPackage.clinicId.equals(actor.clinicId)) {
            throw new PreconditionException('Package does not belong to the current clinic.');
        }

        const history = await this.patientPackageCreditRepository.findByPatientPackageId(payload.id);

        return history.map((c) => new PatientPackageCreditDto(c));
    }
}
