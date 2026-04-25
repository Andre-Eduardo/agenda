import {Injectable} from '@nestjs/common';
import {ClinicalChatInteractionLogRepository} from '../../../domain/clinical-chat/clinical-chat-interaction-log.repository';
import {AgentProposalRepository} from '../../../domain/agent-proposal/agent-proposal.repository';

export type AgentMetricsDto = {
    totalInteractions: number;
    avgIterations: number | null;
    avgDurationMs: number | null;
    topTools: Array<{name: string; count: number}>;
    avgChunksUsed: number | null;
    avgTopKScore: number | null;
    proposalsByType: Record<string, number>;
    proposalConfirmationRate: number | null;
};

@Injectable()
export class GetAgentMetricsService {
    constructor(
        private readonly interactionLogRepository: ClinicalChatInteractionLogRepository,
        private readonly agentProposalRepository: AgentProposalRepository,
    ) {}

    async execute(from: Date, to: Date): Promise<AgentMetricsDto> {
        const [interactions, proposals] = await Promise.all([
            this.interactionLogRepository.getInteractionMetrics(from, to),
            this.agentProposalRepository.getProposalStats(from, to),
        ]);

        return {
            totalInteractions: interactions.totalInteractions,
            avgIterations: interactions.avgIterations,
            avgDurationMs: interactions.avgDurationMs,
            topTools: interactions.topTools,
            avgChunksUsed: interactions.avgChunksUsed,
            avgTopKScore: interactions.avgTopKScore,
            proposalsByType: proposals.byType,
            proposalConfirmationRate: proposals.confirmationRate,
        };
    }
}
