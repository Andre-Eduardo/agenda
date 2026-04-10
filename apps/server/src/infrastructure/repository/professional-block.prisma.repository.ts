import {Injectable} from '@nestjs/common';
import {ProfessionalBlockRepository} from '../../domain/professional/professional-block.repository';
import {ProfessionalBlock, ProfessionalBlockId, ProfessionalId} from '../../domain/professional/entities';
import {ProfessionalBlockMapper} from '../mappers/professional-block.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

@Injectable()
export class ProfessionalBlockPrismaRepository extends PrismaRepository implements ProfessionalBlockRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: ProfessionalBlockMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: ProfessionalBlockId): Promise<ProfessionalBlock | null> {
        const record = await this.prisma.professionalBlock.findUnique({
            where: {id: id.toString()},
        });

        return record === null ? null : this.mapper.toDomain(record);
    }

    async findOverlapping(professionalId: ProfessionalId, startAt: Date, endAt: Date): Promise<ProfessionalBlock[]> {
        const records = await this.prisma.professionalBlock.findMany({
            where: {
                professionalId: professionalId.toString(),
                startAt: {lt: endAt},
                endAt: {gt: startAt},
            },
        });

        return records.map((r) => this.mapper.toDomain(r));
    }

    async save(block: ProfessionalBlock): Promise<void> {
        const data = this.mapper.toPersistence(block);
        await this.prisma.professionalBlock.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }

    async delete(id: ProfessionalBlockId): Promise<void> {
        await this.prisma.professionalBlock.delete({
            where: {id: id.toString()},
        });
    }
}
