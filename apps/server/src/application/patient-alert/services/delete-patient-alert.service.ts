import { Injectable } from "@nestjs/common";
import { ResourceNotFoundException } from "@domain/@shared/exceptions";
import { PatientAlertId } from "@domain/patient-alert/entities";
import { PatientAlertRepository } from "@domain/patient-alert/patient-alert.repository";
import { EventDispatcher } from "@domain/event";
import { ApplicationService, Command } from "@application/@shared/application.service";

type DeletePatientAlertDto = { alertId: PatientAlertId };

@Injectable()
export class DeletePatientAlertService implements ApplicationService<DeletePatientAlertDto> {
  constructor(
    private readonly patientAlertRepository: PatientAlertRepository,
    private readonly eventDispatcher: EventDispatcher,
  ) {}

  async execute({ actor, payload }: Command<DeletePatientAlertDto>): Promise<void> {
    const alert = await this.patientAlertRepository.findById(payload.alertId);

    if (alert === null) {
      throw new ResourceNotFoundException("Patient alert not found.", payload.alertId.toString());
    }

    alert.delete();

    await this.patientAlertRepository.delete(alert.id);

    this.eventDispatcher.dispatch(actor, alert);
  }
}
