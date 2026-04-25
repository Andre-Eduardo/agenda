import {Injectable} from '@nestjs/common';
import {ClinicMemberId} from '../../domain/clinic-member/entities';
import {WorkingHoursRepository} from '../../domain/professional/working-hours.repository';
import {WorkingHours, WorkingHoursId} from '../../domain/professional/entities';
import {WorkingHoursMapper} from '../mappers/working-hours.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

@Injectable()
export class WorkingHoursPrismaRepository extends PrismaRepository implements WorkingHoursRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: WorkingHoursMapper,
    ) {
        super(prismaProvider);
    }

    async findById(id: WorkingHoursId): Promise<WorkingHours | null> {
        const record = await this.prisma.workingHours.findUnique({
            where: {id: id.toString()},
        });
        return record === null ? null : this.mapper.toDomain(record);
    }

    async findByMember(clinicMemberId: ClinicMemberId): Promise<WorkingHours[]> {
        const records = await this.prisma.workingHours.findMany({
            where: {clinicMemberId: clinicMemberId.toString()},
            orderBy: {dayOfWeek: 'asc'},
        });
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findByMemberAndDay(clinicMemberId: ClinicMemberId, dayOfWeek: number): Promise<WorkingHours[]> {
        const records = await this.prisma.workingHours.findMany({
            where: {
                clinicMemberId: clinicMemberId.toString(),
                dayOfWeek,
                active: true,
            },
        });
        return records.map((r) => this.mapper.toDomain(r));
    }

    async save(workingHours: WorkingHours): Promise<void> {
        const data = this.mapper.toPersistence(workingHours);
        await this.prisma.workingHours.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }

    async delete(id: WorkingHoursId): Promise<void> {
        await this.prisma.workingHours.delete({where: {id: id.toString()}});
    }
}
