import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {Record, RecordId} from '../../domain/record/entities/record.entity';
import {RecordRepository} from '../../domain/record/record.repository';
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
}
