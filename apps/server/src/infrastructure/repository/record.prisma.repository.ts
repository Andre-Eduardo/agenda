import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {Record, RecordId} from '../../domain/record/entities/record.entity';
import {RecordRepository, RecordSearchFilter, RecordSortOptions} from '../../domain/record/record.repository';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {RecordMapper} from '../mappers/record.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

// Define a type that includes the relation
type RecordWithFiles = PrismaClient.Record & {
    files: PrismaClient.File[];
};

@Injectable()
export class RecordPrismaRepository extends PrismaRepository implements RecordRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: RecordMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: RecordId): Promise<Record | null> {
        const record = await this.prisma.record.findUnique({
            where: {
                id: id.toString(),
            },
            include: {
                files: true,
            },
        });

        return record === null ? null : this.mapper.toDomain(record);
    }

    async delete(id: RecordId): Promise<void> {
        await this.prisma.record.delete({
            where: {
                id: id.toString(),
            },
        });
    }
    async search(
        pagination: Pagination<RecordSortOptions>,
        filter: RecordSearchFilter = {}
    ): Promise<PaginatedList<Record>> {
        const where: PrismaClient.Prisma.RecordWhereInput = {
            id: filter.ids ? {in: filter.ids.map((id) => id.toString())} : undefined,
            description: filter.term ? {contains: filter.term, mode: 'insensitive'} : undefined,
        };

        const [data, totalCount] = await Promise.all([
            this.prisma.record.findMany({
                where,
                include: {files: true},
                ...this.normalizePagination(pagination, {createdAt: 'desc'}),
            }),
            this.prisma.record.count({where}),
        ]);

        return {
            data: data.map((item) => this.mapper.toDomain(item as RecordWithFiles)),
            totalCount,
        };
    }

    async save(record: Record): Promise<void> {
        const data = this.mapper.toPersistence(record);
        const {files, ...recordData} = data;
        await this.prisma.record.upsert({
            where: {id: recordData.id},
            create: recordData,
            update: recordData,
        });
    }
}
