import {Injectable} from '@nestjs/common';
import {AgentProposalRepository} from '../../../domain/agent-proposal/agent-proposal.repository';
import {AgentProposalId} from '../../../domain/agent-proposal/entities';
import {ResourceNotFoundException, PreconditionException} from '../../../domain/@shared/exceptions';
import type {Command} from '../../@shared/application.service';

export type RejectProposalInput = {proposalId: string; reason?: string};

@Injectable()
export class RejectProposalService {
    constructor(private readonly proposalRepository: AgentProposalRepository) {}

    async execute({actor, payload}: Command<RejectProposalInput>): Promise<void> {
        const proposal = await this.proposalRepository.findById(AgentProposalId.from(payload.proposalId));
        if (!proposal) {
            throw new ResourceNotFoundException('Proposal not found.', payload.proposalId);
        }

        if (proposal.professionalId.toString() !== actor.userId.toString()) {
            throw new PreconditionException('You are not authorized to reject this proposal.');
        }

        proposal.reject(payload.reason);
        await this.proposalRepository.save(proposal);
    }
}
