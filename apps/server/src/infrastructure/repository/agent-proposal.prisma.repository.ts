import { Injectable } from "@nestjs/common";
import * as PrismaClient from "@prisma/client";
import { Prisma } from "@prisma/client";
import { AgentProposal, AgentProposalId } from "@domain/agent-proposal/entities";
import {
  AgentProposalRepository,
  AgentProposalSearchFilter,
  AgentProposalSortOptions,
  ProposalStats,
} from "@domain/agent-proposal/agent-proposal.repository";
import { PaginatedList, Pagination } from "@domain/@shared/repository";
import { AgentProposalMapper } from "@infrastructure/mappers/agent-proposal.mapper";
import { PrismaProvider } from "@infrastructure/repository/prisma/prisma.provider";
import { PrismaRepository } from "@infrastructure/repository/prisma.repository";
import { toEnum } from "@domain/@shared/utils";

@Injectable()
export class AgentProposalPrismaRepository
  extends PrismaRepository
  implements AgentProposalRepository
{
  constructor(
    readonly prismaProvider: PrismaProvider,
    private readonly mapper: AgentProposalMapper,
  ) {
    super(prismaProvider);
  }

  async findById(id: AgentProposalId): Promise<AgentProposal | null> {
    const record = await this.prisma.agentProposal.findUnique({
      where: { id: id.toString() },
    });

    return record === null ? null : this.mapper.toDomain(record);
  }

  async save(proposal: AgentProposal): Promise<void> {
    const data = this.mapper.toPersistence(proposal);
    const writeData: Prisma.AgentProposalUncheckedCreateInput = {
      ...data,
      payload: data.payload as Prisma.InputJsonValue,
      preview: data.preview as Prisma.InputJsonValue,
    };

    await this.prisma.agentProposal.upsert({
      where: { id: data.id },
      create: writeData,
      update: writeData,
    });
  }

  async search(
    pagination: Pagination<AgentProposalSortOptions>,
    filter: AgentProposalSearchFilter = {},
  ): Promise<PaginatedList<AgentProposal>> {
    const where: PrismaClient.Prisma.AgentProposalWhereInput = {
      clinicId: filter.clinicId ? filter.clinicId.toString() : undefined,
      createdByMemberId: filter.createdByMemberId ? filter.createdByMemberId.toString() : undefined,
      patientId: filter.patientId ?? undefined,
      status: filter.status ? toEnum(PrismaClient.AgentProposalStatus, filter.status) : undefined,
    };

    const [data, totalCount] = await Promise.all([
      this.prisma.agentProposal.findMany({
        where,
        ...this.normalizePagination(pagination, { createdAt: "desc" }),
      }),
      this.prisma.agentProposal.count({ where }),
    ]);

    return {
      data: data.map((item) => this.mapper.toDomain(item)),
      totalCount,
    };
  }

  async markExpired(before: Date): Promise<number> {
    const result = await this.prisma.agentProposal.updateMany({
      where: {
        status: PrismaClient.AgentProposalStatus.PENDING,
        expiresAt: { lt: before },
      },
      data: {
        status: PrismaClient.AgentProposalStatus.EXPIRED,
        updatedAt: new Date(),
      },
    });

    return result.count;
  }

  async getProposalStats(from: Date, to: Date): Promise<ProposalStats> {
    const dateFilter = { createdAt: { gte: from, lte: to } };

    const [byTypeRows, confirmed, resolved] = await Promise.all([
      this.prisma.agentProposal.groupBy({
        by: ["proposalType"],
        where: dateFilter,
        _count: { id: true },
      }),
      this.prisma.agentProposal.count({
        where: { ...dateFilter, status: PrismaClient.AgentProposalStatus.CONFIRMED },
      }),
      this.prisma.agentProposal.count({
        where: {
          ...dateFilter,
          status: {
            in: [
              PrismaClient.AgentProposalStatus.CONFIRMED,
              PrismaClient.AgentProposalStatus.REJECTED,
            ],
          },
        },
      }),
    ]);

    const byType: Record<string, number> = {};

    for (const row of byTypeRows) {
      byType[row.proposalType] = row._count.id;
    }

    return {
      byType,
      confirmationRate: resolved > 0 ? confirmed / resolved : null,
    };
  }
}
