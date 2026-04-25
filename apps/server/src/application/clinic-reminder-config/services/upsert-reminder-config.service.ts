import {Injectable} from '@nestjs/common';
import {ClinicReminderConfig} from '../../../domain/clinic-reminder-config/entities';
import {ClinicReminderConfigRepository} from '../../../domain/clinic-reminder-config/clinic-reminder-config.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {ClinicReminderConfigDto, UpsertReminderConfigDto} from '../dtos/clinic-reminder-config.dto';

@Injectable()
export class UpsertReminderConfigService implements ApplicationService<UpsertReminderConfigDto, ClinicReminderConfigDto> {
    constructor(private readonly configRepository: ClinicReminderConfigRepository) {}

    async execute({payload}: Command<UpsertReminderConfigDto>): Promise<ClinicReminderConfigDto> {
        const {clinicId, enabledChannels, hoursBeforeList, isActive} = payload;

        let config = await this.configRepository.findByClinicId(clinicId);

        if (config === null) {
            config = ClinicReminderConfig.create({
                clinicId,
                enabledChannels,
                hoursBeforeList,
                isActive,
            });
        } else {
            config.configure({enabledChannels, hoursBeforeList, isActive});
        }

        await this.configRepository.save(config);

        return new ClinicReminderConfigDto(config);
    }
}
