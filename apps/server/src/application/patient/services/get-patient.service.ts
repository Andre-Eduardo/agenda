import { Injectable } from "@nestjs/common";
import { ResourceNotFoundException } from "@domain/@shared/exceptions";
import { PatientRepository } from "@domain/patient/patient.repository";
import { ApplicationService, Command } from "@application/@shared/application.service";
import { GetPatientDto, PatientDto } from "@application/patient/dtos";

@Injectable()
export class GetPatientService implements ApplicationService<GetPatientDto, PatientDto> {
  constructor(private readonly patientRepository: PatientRepository) {}

  async execute({ actor, payload }: Command<GetPatientDto>): Promise<PatientDto> {
    const patient = await this.patientRepository.findById(payload.id, actor.clinicId ?? undefined);

    if (patient === null) {
      throw new ResourceNotFoundException("Patient not found.", payload.id.toString());
    }

    return new PatientDto(patient);
  }
}
