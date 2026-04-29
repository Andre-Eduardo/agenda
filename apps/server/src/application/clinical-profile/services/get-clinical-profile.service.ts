import { Injectable } from "@nestjs/common";
import { ResourceNotFoundException } from "@domain/@shared/exceptions";
import { ClinicalProfileRepository } from "@domain/clinical-profile/clinical-profile.repository";
import { PatientRepository } from "@domain/patient/patient.repository";
import { ApplicationService, Command } from "@application/@shared/application.service";
import { ClinicalProfileDto, GetClinicalProfileDto } from "@application/clinical-profile/dtos";

@Injectable()
export class GetClinicalProfileService implements ApplicationService<
  GetClinicalProfileDto,
  ClinicalProfileDto | null
> {
  constructor(
    private readonly clinicalProfileRepository: ClinicalProfileRepository,
    private readonly patientRepository: PatientRepository,
  ) {}

  async execute({ payload }: Command<GetClinicalProfileDto>): Promise<ClinicalProfileDto | null> {
    const patient = await this.patientRepository.findById(payload.patientId);

    if (!patient) {
      throw new ResourceNotFoundException("Patient not found.", payload.patientId.toString());
    }

    const profile = await this.clinicalProfileRepository.findByPatientId(payload.patientId);

    return profile ? new ClinicalProfileDto(profile) : null;
  }
}
