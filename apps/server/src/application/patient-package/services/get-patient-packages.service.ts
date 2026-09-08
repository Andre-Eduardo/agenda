import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {ListPatientPackagesDto, PatientPackageDto} from '@application/patient-package/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {PatientPackageRepository} from '@domain/patient-package/patient-package.repository';
import {PatientRepository} from '@domain/patient/patient.repository';

@Injectable()
export class GetPatientPackagesService implements ApplicationService<ListPatientPackagesDto, PatientPackageDto[]> {
    constructor(
        private readonly patientPackageRepository: PatientPackageRepository,
        private readonly patientRepository: PatientRepository
    ) {}

    async execute({actor, payload}: Command<ListPatientPackagesDto>): Promise<PatientPackageDto[]> {
        const patient = await this.patientRepository.findById(payload.patientId, actor.clinicId);

        if (patient === null) {
            throw new ResourceNotFoundException('patient.not_found', payload.patientId.toString());
        }

        const packages = await this.patientPackageRepository.findByPatientId(payload.patientId);

        return packages.map((p) => new PatientPackageDto(p));
    }
}
