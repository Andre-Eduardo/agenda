import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {AppointmentReminderDto} from '@application/appointment-reminder/dtos/appointment-reminder.dto';
import {
    type AppointmentReminder,
    type AppointmentReminderEvent,
    ReminderEventSource,
    ReminderEventType,
} from '@domain/appointment-reminder/entities';

@ApiSchema({name: 'AppointmentReminderEvent'})
export class AppointmentReminderEventDto {
    @ApiProperty({format: 'uuid'})
    id: string;

    @ApiProperty({enum: ReminderEventType, enumName: 'ReminderEventType'})
    type: ReminderEventType;

    @ApiProperty({enum: ReminderEventSource, enumName: 'ReminderEventSource'})
    source: ReminderEventSource;

    @ApiProperty({type: 'integer', nullable: true, description: 'Attempt number the event refers to'})
    attempt: number | null;

    @ApiProperty({
        type: 'string',
        nullable: true,
        description:
            'Error message (SEND_FAILED, DELIVERY_FAILED), next attempt time in ISO 8601 (RETRY_SCHEDULED) ' +
            'or the patient reply (REPLIED), truncated to 500 characters',
    })
    detail: string | null;

    @ApiProperty({format: 'date-time'})
    occurredAt: string;

    constructor(event: AppointmentReminderEvent) {
        this.id = event.id.toString();
        this.type = event.type;
        this.source = event.source;
        this.attempt = event.attempt;
        this.detail = event.detail;
        this.occurredAt = event.occurredAt.toISOString();
    }
}

@ApiSchema({name: 'AppointmentReminderTimeline'})
export class AppointmentReminderTimelineDto extends AppointmentReminderDto {
    @ApiProperty({type: 'string', format: 'date-time', nullable: true})
    deliveredAt: string | null;

    @ApiProperty({type: 'string', format: 'date-time', nullable: true})
    readAt: string | null;

    @ApiProperty({type: 'string', format: 'date-time', nullable: true})
    repliedAt: string | null;

    @ApiProperty({type: [AppointmentReminderEventDto], description: 'Oldest first'})
    events: AppointmentReminderEventDto[];

    constructor(reminder: AppointmentReminder, events: AppointmentReminderEvent[]) {
        super(reminder);
        this.deliveredAt = reminder.deliveredAt?.toISOString() ?? null;
        this.readAt = reminder.readAt?.toISOString() ?? null;
        this.repliedAt = reminder.repliedAt?.toISOString() ?? null;
        this.events = events.map((event) => new AppointmentReminderEventDto(event));
    }
}
