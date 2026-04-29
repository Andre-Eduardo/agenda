import { Injectable } from "@nestjs/common";
import { AppointmentReminderRepository } from "@domain/appointment-reminder/appointment-reminder.repository";
import type { AppointmentId } from "@domain/appointment/entities";

@Injectable()
export class CancelRemindersService {
  constructor(private readonly reminderRepository: AppointmentReminderRepository) {}

  async cancelPendingReminders(appointmentId: AppointmentId): Promise<void> {
    await this.reminderRepository.cancelAllPending(appointmentId);
  }
}
