import {Injectable} from '@nestjs/common';
import {Prisma} from '@prisma/client';
import {AiAgentProfile, AiAgentProfileId} from '../../domain/clinical-chat/entities';
import {AiAgentProfileRepository} from '../../domain/clinical-chat/ai-agent-profile.repository';
import type {AiSpecialtyGroup} from '../../domain/form-template/entities';
import {AiAgentProfileMapper} from '../mappers/ai-agent-profile.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

@Injectable()
export class AiAgentProfilePrismaRepository extends PrismaRepository implements AiAgentProfileRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: AiAgentProfileMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: AiAgentProfileId): Promise<AiAgentProfile | null> {
        const record = await this.prisma.aiAgentProfile.findUnique({
            where: {id: id.toString()},
        });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findBySlug(slug: string): Promise<AiAgentProfile | null> {
        const record = await this.prisma.aiAgentProfile.findUnique({
            where: {slug},
        });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findBySpecialty(specialty: AiSpecialtyGroup): Promise<AiAgentProfile | null> {
        const record = await this.prisma.aiAgentProfile.findFirst({
            where: {
                specialtyGroup: specialty,
                isActive: true,
            },
        });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findAllActive(): Promise<AiAgentProfile[]> {
        const records = await this.prisma.aiAgentProfile.findMany({
            where: {isActive: true},
            orderBy: {name: 'asc'},
        });
        return records.map((r) => this.mapper.toDomain(r));
    }

    async save(profile: AiAgentProfile): Promise<void> {
        const data = this.mapper.toPersistence(profile);
        // Nullable JSON fields require Prisma.DbNull instead of null for create/update operations
        const jsonFields = {
            contextPriority: data.contextPriority ?? Prisma.DbNull,
            priorityFields: data.priorityFields ?? Prisma.DbNull,
        };
        await this.prisma.aiAgentProfile.upsert({
            where: {id: data.id},
            create: {...data, ...jsonFields},
            update: {...data, ...jsonFields},
        });
    }
}
