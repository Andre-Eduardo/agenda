import {Injectable} from '@nestjs/common';
import {AppointmentReminderRepository} from '../../domain/appointment-reminder/appointment-reminder.repository';
import type {AppointmentId} from '../../domain/appointment/entities';
import type {ClinicId} from '../../domain/clinic/entities';
import {AppointmentReminder, AppointmentReminderId, ReminderStatus} from '../../domain/appointment-reminder/entities';
import {AppointmentReminderMapper} from '../mappers/appointment-reminder.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

@Injectable()
export class AppointmentReminderPrismaRepository extends PrismaRepository implements AppointmentReminderRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: AppointmentReminderMapper,
    ) {
        super(prismaProvider);
    }

    async findById(id: AppointmentReminderId): Promise<AppointmentReminder | null> {
        const record = await this.prisma.appointmentReminder.findUnique({
            where: {id: id.toString()},
        });

        return record === null ? null : this.mapper.toDomain(record);
    }

    async save(reminder: AppointmentReminder): Promise<void> {
        const data = this.mapper.toPersistence(reminder);

        await this.prisma.appointmentReminder.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }

    async saveMany(reminders: AppointmentReminder[]): Promise<void> {
        const data = reminders.map((r) => this.mapper.toPersistence(r));

        await this.prisma.appointmentReminder.createMany({data});
    }

    async findPendingByAppointmentId(appointmentId: AppointmentId): Promise<AppointmentReminder[]> {
        const records = await this.prisma.appointmentReminder.findMany({
            where: {
                appointmentId: appointmentId.toString(),
                status: ReminderStatus.PENDING,
            },
        });

        return records.map((r) => this.mapper.toDomain(r));
    }

    async findDueForDispatch(clinicId: ClinicId, withinMinutes: number): Promise<AppointmentReminder[]> {
        const cutoff = new Date(Date.now() + withinMinutes * 60 * 1000);
        const records = await this.prisma.appointmentReminder.findMany({
            where: {
                clinicId: clinicId.toString(),
                status: ReminderStatus.PENDING,
                scheduledAt: {lte: cutoff},
            },
            orderBy: {scheduledAt: 'asc'},
        });

        return records.map((r) => this.mapper.toDomain(r));
    }

    async cancelAllPending(appointmentId: AppointmentId): Promise<void> {
        await this.prisma.appointmentReminder.updateMany({
            where: {
                appointmentId: appointmentId.toString(),
                status: ReminderStatus.PENDING,
            },
            data: {
                status: ReminderStatus.CANCELLED,
                updatedAt: new Date(),
            },
        });
    }
}
