import type { PaginatedList, Pagination } from "@domain/@shared/repository";
import type { ClinicId } from "@domain/clinic/entities";
import type { ClinicMemberId } from "@domain/clinic-member/entities";
import type {
  AgentProposal,
  AgentProposalId,
  AgentProposalStatus,
} from "@domain/agent-proposal/entities";

export type AgentProposalSearchFilter = {
  clinicId?: ClinicId;
  createdByMemberId?: ClinicMemberId;
  patientId?: string;
  status?: AgentProposalStatus;
};

export type AgentProposalSortOptions = ["createdAt", "updatedAt", "expiresAt"];

export type ProposalStats = {
  byType: Record<string, number>;
  confirmationRate: number | null;
};

export interface AgentProposalRepository {
  findById(id: AgentProposalId): Promise<AgentProposal | null>;
  save(proposal: AgentProposal): Promise<void>;
  search(
    pagination: Pagination<AgentProposalSortOptions>,
    filter?: AgentProposalSearchFilter,
  ): Promise<PaginatedList<AgentProposal>>;
  markExpired(before: Date): Promise<number>;
  getProposalStats(from: Date, to: Date): Promise<ProposalStats>;
}

export abstract class AgentProposalRepository {}
