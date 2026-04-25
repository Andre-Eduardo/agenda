import type {ClinicId} from '../clinic/entities';
import type {ClinicReminderConfig, ClinicReminderConfigId} from './entities';

export interface ClinicReminderConfigRepository {
    findById(id: ClinicReminderConfigId): Promise<ClinicReminderConfig | null>;
    findByClinicId(clinicId: ClinicId): Promise<ClinicReminderConfig | null>;
    save(config: ClinicReminderConfig): Promise<void>;
}

export abstract class ClinicReminderConfigRepository {}
