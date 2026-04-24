import {Injectable} from '@nestjs/common';
import {ClinicalChatInteractionLog, ClinicalChatInteractionLogId, PatientChatSessionId} from '../../domain/clinical-chat/entities';
import {ClinicalChatInteractionLogRepository, InteractionMetrics} from '../../domain/clinical-chat/clinical-chat-interaction-log.repository';
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

    async getInteractionMetrics(from: Date, to: Date): Promise<InteractionMetrics> {
        const [agg, toolRows] = await Promise.all([
            this.prisma.clinicalChatInteractionLog.aggregate({
                where: {createdAt: {gte: from, lte: to}},
                _count: {id: true},
                _avg: {
                    totalIterations: true,
                    totalDurationMs: true,
                    ragChunksUsed: true,
                    avgTopKScore: true,
                },
            }),
            this.prisma.$queryRaw<Array<{tool_name: string; count: bigint}>>`
                SELECT t.tool_name, COUNT(*)::bigint AS count
                FROM clinical_chat_interaction_log l, unnest(l.tool_names) AS t(tool_name)
                WHERE l.created_at >= ${from} AND l.created_at <= ${to}
                GROUP BY t.tool_name
                ORDER BY count DESC
                LIMIT 10
            `,
        ]);

        return {
            totalInteractions: agg._count.id,
            avgIterations: agg._avg.totalIterations,
            avgDurationMs: agg._avg.totalDurationMs,
            avgChunksUsed: agg._avg.ragChunksUsed,
            avgTopKScore: agg._avg.avgTopKScore,
            topTools: toolRows.map((r) => ({name: r.tool_name, count: Number(r.count)})),
        };
    }
}
