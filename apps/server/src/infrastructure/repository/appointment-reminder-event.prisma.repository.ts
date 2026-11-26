import {Injectable} from '@nestjs/common';
import {AppointmentReminderEventRepository} from '@domain/appointment-reminder/appointment-reminder-event.repository';
import type {AppointmentReminderEvent, AppointmentReminderId} from '@domain/appointment-reminder/entities';
import {AppointmentReminderEventMapper} from '@infrastructure/mappers/appointment-reminder-event.mapper';
import {PrismaRepository} from '@infrastructure/repository/prisma.repository';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';

@Injectable()
export class AppointmentReminderEventPrismaRepository
    extends PrismaRepository
    implements AppointmentReminderEventRepository
{
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: AppointmentReminderEventMapper
    ) {
        super(prismaProvider);
    }

    async recordIfAbsent(event: AppointmentReminderEvent): Promise<boolean> {
        // The unique index on (source, external_id) turns a repeated webhook delivery into a no-op.
        const {count} = await this.prisma.appointmentReminderEvent.createMany({
            data: [this.mapper.toPersistence(event)],
            skipDuplicates: true,
        });

        return count > 0;
    }

    async findByReminderIds(reminderIds: AppointmentReminderId[]): Promise<AppointmentReminderEvent[]> {
        if (reminderIds.length === 0) return [];

        const records = await this.prisma.appointmentReminderEvent.findMany({
            where: {reminderId: {in: reminderIds.map((id) => id.toString())}},
            orderBy: [{occurredAt: 'asc'}, {createdAt: 'asc'}],
        });

        return records.map((record) => this.mapper.toDomain(record));
    }
}
