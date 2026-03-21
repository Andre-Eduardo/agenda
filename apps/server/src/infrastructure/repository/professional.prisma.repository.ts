import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {Professional, ProfessionalId} from '../../domain/professional/entities';
import {ProfessionalRepository, ProfessionalSearchFilter, ProfessionalSortOptions} from '../../domain/professional/professional.repository';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {ProfessionalMapper} from '../mappers/professional.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

export type ProfessionalModel = PrismaClient.Professional;

@Injectable()
export class ProfessionalPrismaRepository extends PrismaRepository implements ProfessionalRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: ProfessionalMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: ProfessionalId): Promise<Professional | null> {
        const professional = await this.prisma.professional.findUnique({
            where: {
                id: id.toString(),
            },
            include: {
                person: true,
            },
        });

        return professional === null ? null : this.mapper.toDomain(professional);
    }

    async delete(id: ProfessionalId): Promise<void> {
        await this.prisma.professional.delete({
            where: {
                id: id.toString(),
            },
        });
    }
    async search(
        pagination: Pagination<ProfessionalSortOptions>,
        filter: ProfessionalSearchFilter = {}
    ): Promise<PaginatedList<Professional>> {
        const where: PrismaClient.Prisma.ProfessionalWhereInput = {
            id: filter.ids ? {in: filter.ids.map((id) => id.toString())} : undefined,
            OR: filter.term
                ? [
                      {person: {name: {contains: filter.term, mode: 'insensitive'}}},
                      {person: {documentId: {contains: filter.term}}},
                      {specialty: {contains: filter.term, mode: 'insensitive'}},
                  ]
                : undefined,
        };

        const [data, totalCount] = await Promise.all([
            this.prisma.professional.findMany({
                where,
                include: {person: true},
                ...this.normalizePagination(pagination, {createdAt: 'desc'}),
            }),
            this.prisma.professional.count({where}),
        ]);

        return {
            data: data.map((item) => this.mapper.toDomain(item)),
            totalCount,
        };
    }

    async save(professional: Professional): Promise<void> {
        const data = this.mapper.toPersistence(professional);
        await this.prisma.professional.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }
}
