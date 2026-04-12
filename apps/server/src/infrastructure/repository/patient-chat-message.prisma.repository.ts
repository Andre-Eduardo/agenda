import {Injectable} from '@nestjs/common';
import {PatientChatMessage, PatientChatMessageId, PatientChatSessionId} from '../../domain/clinical-chat/entities';
import {
    PatientChatMessageRepository,
    PatientChatMessageSortOptions,
} from '../../domain/clinical-chat/patient-chat-message.repository';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {PatientChatMessageMapper} from '../mappers/patient-chat-message.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

@Injectable()
export class PatientChatMessagePrismaRepository
    extends PrismaRepository
    implements PatientChatMessageRepository
{
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: PatientChatMessageMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: PatientChatMessageId): Promise<PatientChatMessage | null> {
        const record = await this.prisma.patientChatMessage.findUnique({
            where: {id: id.toString()},
        });
        return record ? this.mapper.toDomain(record) : null;
    }

    async listBySession(
        sessionId: PatientChatSessionId,
        pagination: Pagination<PatientChatMessageSortOptions>
    ): Promise<PaginatedList<PatientChatMessage>> {
        const where = {sessionId: sessionId.toString()};

        const [data, totalCount] = await Promise.all([
            this.prisma.patientChatMessage.findMany({
                where,
                ...this.normalizePagination(pagination, {createdAt: 'asc'}),
            }),
            this.prisma.patientChatMessage.count({where}),
        ]);

        return {
            data: data.map((item) => this.mapper.toDomain(item)),
            totalCount,
        };
    }

    async save(message: PatientChatMessage): Promise<void> {
        const data = this.mapper.toPersistence(message);
        await this.prisma.patientChatMessage.upsert({
            where: {id: data.id},
            create: data as any,
            update: data as any,
        });
    }
}
