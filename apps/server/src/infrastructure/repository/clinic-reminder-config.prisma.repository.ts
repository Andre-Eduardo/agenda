import {Injectable} from '@nestjs/common';
import {ClinicReminderConfigRepository} from '../../domain/clinic-reminder-config/clinic-reminder-config.repository';
import type {ClinicId} from '../../domain/clinic/entities';
import {ClinicReminderConfig, ClinicReminderConfigId} from '../../domain/clinic-reminder-config/entities';
import {ClinicReminderConfigMapper} from '../mappers/clinic-reminder-config.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

@Injectable()
export class ClinicReminderConfigPrismaRepository extends PrismaRepository implements ClinicReminderConfigRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: ClinicReminderConfigMapper,
    ) {
        super(prismaProvider);
    }

    async findById(id: ClinicReminderConfigId): Promise<ClinicReminderConfig | null> {
        const record = await this.prisma.clinicReminderConfig.findUnique({
            where: {id: id.toString()},
        });

        return record === null ? null : this.mapper.toDomain(record);
    }

    async findByClinicId(clinicId: ClinicId): Promise<ClinicReminderConfig | null> {
        const record = await this.prisma.clinicReminderConfig.findUnique({
            where: {clinicId: clinicId.toString()},
        });

        return record === null ? null : this.mapper.toDomain(record);
    }

    async save(config: ClinicReminderConfig): Promise<void> {
        const data = this.mapper.toPersistence(config);

        await this.prisma.clinicReminderConfig.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }
}
