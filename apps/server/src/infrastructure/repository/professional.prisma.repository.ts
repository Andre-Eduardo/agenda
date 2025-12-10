import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {Professional, ProfessionalId} from '../../domain/professional/entities';
import {ProfessionalRepository} from '../../domain/professional/professional.repository';
import {ProfessionalMapper} from '../mappers/professional.mapper';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';
import { PrismaProvider } from './prisma/prisma.provider';

export type ProfessionalModel = PrismaClient.Professional;

@Injectable()
export class ProfessionalPrismaRepository extends PrismaRepository implements ProfessionalRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: ProfessionalMapper,
    ) {
        super(prismaProvider);
    }

    async findById(id: ProfessionalId): Promise<Professional | null> {
        const professional = await this.prisma.professional.findUnique({
            where: {
                id: id.toString(),
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
}
