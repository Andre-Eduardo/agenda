import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {ClinicReminderConfigDto} from '@application/clinic-reminder-config/dtos/clinic-reminder-config.dto';
import {ClinicReminderConfigRepository} from '@domain/clinic-reminder-config/clinic-reminder-config.repository';
import {ClinicReminderConfig} from '@domain/clinic-reminder-config/entities';
import type {ClinicId} from '@domain/clinic/entities';

export type GetReminderConfigPayload = {clinicId: ClinicId};

/** Returns the clinic settings, or the (inactive, unsaved) defaults when the clinic never saved them. */
@Injectable()
export class GetReminderConfigService implements ApplicationService<GetReminderConfigPayload, ClinicReminderConfigDto> {
    constructor(private readonly configRepository: ClinicReminderConfigRepository) {}

    async execute({actor, payload: {clinicId}}: Command<GetReminderConfigPayload>): Promise<ClinicReminderConfigDto> {
        assertEntityBelongsToClinic(clinicId, actor.clinicId);

        const config = await this.configRepository.findByClinicId(clinicId);

        if (config === null) {
            return new ClinicReminderConfigDto(ClinicReminderConfig.defaultFor(clinicId), false);
        }

        return new ClinicReminderConfigDto(config);
    }
}
