import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {toEnum} from '@domain/@shared/utils';
import {AppointmentReminderRepository} from '@domain/appointment-reminder/appointment-reminder.repository';
import {
    AppointmentReminder,
    AppointmentReminderId,
    ReminderChannel,
    ReminderStatus,
} from '@domain/appointment-reminder/entities';
import type {AppointmentId} from '@domain/appointment/entities';
import type {ClinicId} from '@domain/clinic/entities';
import {AppointmentReminderMapper} from '@infrastructure/mappers/appointment-reminder.mapper';
import {PrismaRepository} from '@infrastructure/repository/prisma.repository';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';

@Injectable()
export class AppointmentReminderPrismaRepository extends PrismaRepository implements AppointmentReminderRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: AppointmentReminderMapper
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
            // Gravar o resultado do envio libera o lease de `claimForDispatch`, para que um
            // retry agendado (status volta a PENDING) não fique preso até o lease expirar.
            update: {...data, claimedUntil: null},
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

    async claimForDispatch(id: AppointmentReminderId, leaseMs: number): Promise<boolean> {
        const now = new Date();
        // UPDATE condicional: no Postgres a linha fica travada durante o UPDATE e o WHERE é
        // reavaliado após a trava, então só uma transação concorrente consegue o lease.
        const {count} = await this.prisma.appointmentReminder.updateMany({
            where: {
                id: id.toString(),
                status: ReminderStatus.PENDING,
                OR: [{claimedUntil: null}, {claimedUntil: {lt: now}}],
            },
            data: {claimedUntil: new Date(now.getTime() + leaseMs)},
        });

        return count === 1;
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

    async findByAppointmentId(appointmentId: AppointmentId): Promise<AppointmentReminder[]> {
        const records = await this.prisma.appointmentReminder.findMany({
            where: {appointmentId: appointmentId.toString()},
            orderBy: [{scheduledAt: 'asc'}, {createdAt: 'asc'}],
        });

        return records.map((r) => this.mapper.toDomain(r));
    }

    countPendingScheduledBefore(scheduledBefore: Date): Promise<number> {
        return this.prisma.appointmentReminder.count({
            where: {status: ReminderStatus.PENDING, scheduledAt: {lt: scheduledBefore}},
        });
    }

    async findByProviderMessageId(
        clinicId: ClinicId | null,
        channel: ReminderChannel,
        providerMessageId: string
    ): Promise<AppointmentReminder | null> {
        const record = await this.prisma.appointmentReminder.findFirst({
            where: {
                ...(clinicId === null ? {} : {clinicId: clinicId.toString()}),
                channel: toEnum(PrismaClient.ReminderChannel, channel),
                providerMessageId,
            },
            orderBy: {sentAt: 'desc'},
        });

        return record === null ? null : this.mapper.toDomain(record);
    }

    async findLatestSentTo(
        clinicId: ClinicId,
        channel: ReminderChannel,
        destinations: string[],
        sentSince: Date
    ): Promise<AppointmentReminder | null> {
        if (destinations.length === 0) return null;

        const record = await this.prisma.appointmentReminder.findFirst({
            where: {
                clinicId: clinicId.toString(),
                channel: toEnum(PrismaClient.ReminderChannel, channel),
                destination: {in: destinations},
                sentAt: {gte: sentSince},
            },
            orderBy: {sentAt: 'desc'},
        });

        return record === null ? null : this.mapper.toDomain(record);
    }
}
