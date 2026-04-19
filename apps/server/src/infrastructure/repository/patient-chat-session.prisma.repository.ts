import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {PatientChatSession, PatientChatSessionId} from '../../domain/clinical-chat/entities';
import {
    PatientChatSessionRepository,
    PatientChatSessionFilter,
    PatientChatSessionSortOptions,
} from '../../domain/clinical-chat/patient-chat-session.repository';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {toEnumOrNull} from '../../domain/@shared/utils';
import {PatientChatSessionMapper} from '../mappers/patient-chat-session.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

@Injectable()
export class PatientChatSessionPrismaRepository
    extends PrismaRepository
    implements PatientChatSessionRepository
{
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: PatientChatSessionMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: PatientChatSessionId): Promise<PatientChatSession | null> {
        const record = await this.prisma.patientChatSession.findUnique({
            where: {id: id.toString()},
        });
        return record ? this.mapper.toDomain(record) : null;
    }

    async search(
        pagination: Pagination<PatientChatSessionSortOptions>,
        filter: PatientChatSessionFilter = {}
    ): Promise<PaginatedList<PatientChatSession>> {
        const where: PrismaClient.Prisma.PatientChatSessionWhereInput = {
            patientId: filter.patientId?.toString(),
            professionalId: filter.professionalId?.toString(),
            status: toEnumOrNull(PrismaClient.ChatSessionStatus, filter.status) ?? undefined,
            deletedAt: null,
        };

        const [data, totalCount] = await Promise.all([
            this.prisma.patientChatSession.findMany({
                where,
                ...this.normalizePagination(pagination, {lastActivityAt: 'desc'}),
            }),
            this.prisma.patientChatSession.count({where}),
        ]);

        return {
            data: data.map((item) => this.mapper.toDomain(item)),
            totalCount,
        };
    }

    async save(session: PatientChatSession): Promise<void> {
        const data = this.mapper.toPersistence(session);
        await this.prisma.patientChatSession.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }

    async delete(id: PatientChatSessionId): Promise<void> {
        await this.prisma.patientChatSession.update({
            where: {id: id.toString()},
            data: {deletedAt: new Date()},
        });
    }
}
