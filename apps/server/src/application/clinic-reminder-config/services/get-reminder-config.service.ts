import { Injectable } from "@nestjs/common";
import { ResourceNotFoundException } from "@domain/@shared/exceptions";
import { ClinicReminderConfigRepository } from "@domain/clinic-reminder-config/clinic-reminder-config.repository";
import { ApplicationService, Command } from "@application/@shared/application.service";
import { ClinicReminderConfigDto } from "@application/clinic-reminder-config/dtos/clinic-reminder-config.dto";
import type { ClinicId } from "@domain/clinic/entities";

export type GetReminderConfigPayload = { clinicId: ClinicId };

@Injectable()
export class GetReminderConfigService implements ApplicationService<
  GetReminderConfigPayload,
  ClinicReminderConfigDto
> {
  constructor(private readonly configRepository: ClinicReminderConfigRepository) {}

  async execute({
    payload: { clinicId },
  }: Command<GetReminderConfigPayload>): Promise<ClinicReminderConfigDto> {
    const config = await this.configRepository.findByClinicId(clinicId);

    if (config === null) {
      throw new ResourceNotFoundException("clinic_reminder_config.not_found", clinicId.toString());
    }

    return new ClinicReminderConfigDto(config);
  }
}
