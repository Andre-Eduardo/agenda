import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {
    ClinicReminderConfigDto,
    UpsertReminderConfigDto,
} from '@application/clinic-reminder-config/dtos/clinic-reminder-config.dto';
import {ClinicReminderConfigRepository} from '@domain/clinic-reminder-config/clinic-reminder-config.repository';
import {ClinicReminderConfig} from '@domain/clinic-reminder-config/entities';
import type {ClinicId} from '@domain/clinic/entities';

export type UpsertReminderConfigCommand = UpsertReminderConfigDto & {clinicId: ClinicId};

@Injectable()
export class UpsertReminderConfigService implements ApplicationService<
    UpsertReminderConfigCommand,
    ClinicReminderConfigDto
> {
    constructor(private readonly configRepository: ClinicReminderConfigRepository) {}

    async execute({actor, payload}: Command<UpsertReminderConfigCommand>): Promise<ClinicReminderConfigDto> {
        const {clinicId, enabledChannels, hoursBeforeList, messageTemplate, isActive} = payload;

        assertEntityBelongsToClinic(clinicId, actor.clinicId);

        let config = await this.configRepository.findByClinicId(clinicId);

        if (config === null) {
            config = ClinicReminderConfig.create({
                clinicId,
                enabledChannels,
                hoursBeforeList,
                messageTemplate,
                isActive,
            });
        } else {
            config.configure({enabledChannels, hoursBeforeList, messageTemplate, isActive});
        }

        await this.configRepository.save(config);

        return new ClinicReminderConfigDto(config);
    }
}
