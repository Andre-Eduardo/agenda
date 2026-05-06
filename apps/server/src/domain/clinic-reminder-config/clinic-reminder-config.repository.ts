import type {ClinicReminderConfig, ClinicReminderConfigId} from '@domain/clinic-reminder-config/entities';
import type {ClinicId} from '@domain/clinic/entities';

export interface ClinicReminderConfigRepository {
    findById(id: ClinicReminderConfigId): Promise<ClinicReminderConfig | null>;
    findByClinicId(clinicId: ClinicId): Promise<ClinicReminderConfig | null>;
    save(config: ClinicReminderConfig): Promise<void>;
}

export abstract class ClinicReminderConfigRepository {}
