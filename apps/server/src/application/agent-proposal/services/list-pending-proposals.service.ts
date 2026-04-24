import {Injectable} from '@nestjs/common';
import {AgentProposalRepository} from '../../../domain/agent-proposal/agent-proposal.repository';
import {AgentProposalStatus} from '../../../domain/agent-proposal/entities';
import {ProfessionalId} from '../../../domain/professional/entities';
import type {Command} from '../../@shared/application.service';

export type ListPendingProposalsInput = {professionalId: string};
export type ProposalSummary = {
    id: string;
    type: string;
    status: string;
    patientId: string | null;
    preview: Record<string, unknown>;
    confidence: number | null;
    expiresAt: string | null;
    createdAt: string;
};

@Injectable()
export class ListPendingProposalsService {
    constructor(private readonly proposalRepository: AgentProposalRepository) {}

    async execute({payload}: Command<ListPendingProposalsInput>): Promise<ProposalSummary[]> {
        const result = await this.proposalRepository.search(
            {page: 1, limit: 50, sort: [{key: 'createdAt', direction: 'desc'}]},
            {
                professionalId: ProfessionalId.from(payload.professionalId),
                status: AgentProposalStatus.PENDING,
            },
        );

        return result.data.map((p) => ({
            id: p.id.toString(),
            type: p.type,
            status: p.status,
            patientId: p.patientId,
            preview: p.preview,
            confidence: p.confidence,
            expiresAt: p.expiresAt?.toISOString() ?? null,
            createdAt: p.createdAt.toISOString(),
        }));
    }
}
