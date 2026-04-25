import {Injectable} from '@nestjs/common';
import {AppointmentReminderRepository} from '../../../domain/appointment-reminder/appointment-reminder.repository';
import type {ClinicId} from '../../../domain/clinic/entities';
import {AppointmentReminderDto} from '../dtos/appointment-reminder.dto';

@Injectable()
export class ListPendingRemindersService {
    constructor(private readonly reminderRepository: AppointmentReminderRepository) {}

    async listDue(clinicId: ClinicId): Promise<AppointmentReminderDto[]> {
        const reminders = await this.reminderRepository.findDueForDispatch(clinicId, 10);
        return reminders.map((r) => new AppointmentReminderDto(r));
    }
}
