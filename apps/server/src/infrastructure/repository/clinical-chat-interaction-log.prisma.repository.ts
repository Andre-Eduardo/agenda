import {Injectable} from '@nestjs/common';
import {ClinicalChatInteractionLog, ClinicalChatInteractionLogId, PatientChatSessionId} from '../../domain/clinical-chat/entities';
import {ClinicalChatInteractionLogRepository} from '../../domain/clinical-chat/clinical-chat-interaction-log.repository';
import {ClinicalChatInteractionLogMapper} from '../mappers/clinical-chat-interaction-log.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

@Injectable()
export class ClinicalChatInteractionLogPrismaRepository
    extends PrismaRepository
    implements ClinicalChatInteractionLogRepository
{
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: ClinicalChatInteractionLogMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: ClinicalChatInteractionLogId): Promise<ClinicalChatInteractionLog | null> {
        const record = await this.prisma.clinicalChatInteractionLog.findUnique({
            where: {id: id.toString()},
        });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findBySessionId(sessionId: PatientChatSessionId): Promise<ClinicalChatInteractionLog[]> {
        const records = await this.prisma.clinicalChatInteractionLog.findMany({
            where: {sessionId: sessionId.toString()},
            orderBy: {createdAt: 'desc'},
        });
        return records.map((r) => this.mapper.toDomain(r));
    }

    async save(log: ClinicalChatInteractionLog): Promise<void> {
        const data = this.mapper.toPersistence(log);
        await this.prisma.clinicalChatInteractionLog.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }
}
