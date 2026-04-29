import { Injectable } from "@nestjs/common";
import { ResourceNotFoundException } from "@domain/@shared/exceptions";
import { PatientAlertId } from "@domain/patient-alert/entities";
import { PatientAlertRepository } from "@domain/patient-alert/patient-alert.repository";
import { ApplicationService, Command } from "@application/@shared/application.service";
import { PatientAlertDto } from "@application/patient-alert/dtos";

type GetPatientAlertDto = { alertId: PatientAlertId };

@Injectable()
export class GetPatientAlertService implements ApplicationService<
  GetPatientAlertDto,
  PatientAlertDto
> {
  constructor(private readonly patientAlertRepository: PatientAlertRepository) {}

  async execute({ payload }: Command<GetPatientAlertDto>): Promise<PatientAlertDto> {
    const alert = await this.patientAlertRepository.findById(payload.alertId);

    if (alert === null) {
      throw new ResourceNotFoundException("Patient alert not found.", payload.alertId.toString());
    }

    return new PatientAlertDto(alert);
  }
}
