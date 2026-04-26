import {Injectable} from '@nestjs/common';
import {ClinicMemberId} from '../../domain/clinic-member/entities';
import {MemberBlockRepository} from '../../domain/professional/member-block.repository';
import {MemberBlock, MemberBlockId} from '../../domain/professional/entities';
import {MemberBlockMapper} from '../mappers/member-block.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

@Injectable()
export class MemberBlockPrismaRepository extends PrismaRepository implements MemberBlockRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: MemberBlockMapper,
    ) {
        super(prismaProvider);
    }

    async findById(id: MemberBlockId): Promise<MemberBlock | null> {
        const record = await this.prisma.memberBlock.findUnique({
            where: {id: id.toString()},
        });
        return record === null ? null : this.mapper.toDomain(record);
    }

    async findByMember(
        clinicMemberId: ClinicMemberId,
        filters?: {startAt?: Date; endAt?: Date},
    ): Promise<MemberBlock[]> {
        const records = await this.prisma.memberBlock.findMany({
            where: {
                clinicMemberId: clinicMemberId.toString(),
                deletedAt: null,
                ...(filters?.startAt !== undefined && {endAt: {gt: filters.startAt}}),
                ...(filters?.endAt !== undefined && {startAt: {lt: filters.endAt}}),
            },
            orderBy: {startAt: 'asc'},
        });
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findOverlapping(
        clinicMemberId: ClinicMemberId,
        startAt: Date,
        endAt: Date,
    ): Promise<MemberBlock[]> {
        const records = await this.prisma.memberBlock.findMany({
            where: {
                clinicMemberId: clinicMemberId.toString(),
                deletedAt: null,
                startAt: {lt: endAt},
                endAt: {gt: startAt},
            },
        });
        return records.map((r) => this.mapper.toDomain(r));
    }

    async save(block: MemberBlock): Promise<void> {
        const data = this.mapper.toPersistence(block);
        await this.prisma.memberBlock.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }

    async delete(id: MemberBlockId): Promise<void> {
        await this.prisma.memberBlock.delete({where: {id: id.toString()}});
    }
}
