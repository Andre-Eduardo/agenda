import type {ClinicLicense} from '@domain/clinic-license/entities';
import type {ClinicId} from '@domain/clinic/entities';

export interface ClinicLicenseRepository {
    findByClinicId(clinicId: ClinicId): Promise<ClinicLicense | null>;
    save(license: ClinicLicense): Promise<void>;
}

export abstract class ClinicLicenseRepository {}
