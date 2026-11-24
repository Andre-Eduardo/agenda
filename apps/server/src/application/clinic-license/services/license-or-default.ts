import type {ClinicLicenseRepository} from '@domain/clinic-license/clinic-license.repository';
import {ClinicLicense} from '@domain/clinic-license/entities';
import type {ClinicId} from '@domain/clinic/entities';

/** Clínica sem licença gravada está no sistema base: os padrões do domínio valem. */
export async function licenseOrDefault(
    repository: ClinicLicenseRepository,
    clinicId: ClinicId
): Promise<ClinicLicense> {
    return (await repository.findByClinicId(clinicId)) ?? ClinicLicense.create({clinicId});
}
