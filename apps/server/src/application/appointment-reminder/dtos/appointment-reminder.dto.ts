import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import type { AppointmentReminder } from "@domain/appointment-reminder/entities";
import { ReminderChannel, ReminderStatus } from "@domain/appointment-reminder/entities";
import { EntityDto } from "@application/@shared/dto";

@ApiSchema({ name: "AppointmentReminder" })
export class AppointmentReminderDto extends EntityDto {
  @ApiProperty({ format: "uuid" })
  clinicId: string;

  @ApiProperty({ format: "uuid" })
  appointmentId: string;

  @ApiProperty({ format: "uuid" })
  patientId: string;

  @ApiProperty({ enum: ReminderChannel })
  channel: ReminderChannel;

  @ApiProperty({ enum: ReminderStatus })
  status: ReminderStatus;

  @ApiProperty({ format: "date-time" })
  scheduledAt: string;

  @ApiProperty({ format: "date-time", nullable: true })
  sentAt: string | null;

  @ApiProperty({ format: "date-time", nullable: true })
  failedAt: string | null;

  @ApiProperty()
  attempts: number;

  @ApiProperty({ nullable: true })
  errorMessage: string | null;

  constructor(reminder: AppointmentReminder) {
    super(reminder);
    this.clinicId = reminder.clinicId.toString();
    this.appointmentId = reminder.appointmentId.toString();
    this.patientId = reminder.patientId.toString();
    this.channel = reminder.channel;
    this.status = reminder.status;
    this.scheduledAt = reminder.scheduledAt.toISOString();
    this.sentAt = reminder.sentAt?.toISOString() ?? null;
    this.failedAt = reminder.failedAt?.toISOString() ?? null;
    this.attempts = reminder.attempts;
    this.errorMessage = reminder.errorMessage;
  }
}
