import type {PatientPackageCredit, PatientPackageId} from '@domain/patient-package/entities';

export interface PatientPackageCreditRepository {
    findByPatientPackageId(patientPackageId: PatientPackageId): Promise<PatientPackageCredit[]>;

    save(credit: PatientPackageCredit): Promise<void>;
}

export abstract class PatientPackageCreditRepository {}
