import { Injectable } from "@nestjs/common";
import {
  DraftEvolution,
  DraftEvolutionId,
} from "@domain/draft-evolution/entities/draft-evolution.entity";
import { DraftEvolutionRepository } from "@domain/draft-evolution/draft-evolution.repository";
import { ImportedDocumentId } from "@domain/record/entities/imported-document.entity";
import { DraftEvolutionMapper } from "@infrastructure/mappers/draft-evolution.mapper";
import { PrismaProvider } from "@infrastructure/repository/prisma/prisma.provider";
import { PrismaRepository } from "@infrastructure/repository/prisma.repository";

@Injectable()
export class DraftEvolutionPrismaRepository
  extends PrismaRepository
  implements DraftEvolutionRepository
{
  constructor(
    readonly prismaProvider: PrismaProvider,
    private readonly mapper: DraftEvolutionMapper,
  ) {
    super(prismaProvider);
  }

  async findById(id: DraftEvolutionId): Promise<DraftEvolution | null> {
    const model = await this.prisma.draftEvolution.findUnique({
      where: { id: id.toString() },
    });

    return model === null ? null : this.mapper.toDomain(model);
  }

  async findByImportedDocumentId(
    importedDocumentId: ImportedDocumentId,
  ): Promise<DraftEvolution | null> {
    const model = await this.prisma.draftEvolution.findUnique({
      where: { importedDocumentId: importedDocumentId.toString() },
    });

    return model === null ? null : this.mapper.toDomain(model);
  }

  async save(draft: DraftEvolution): Promise<void> {
    const data = this.mapper.toPersistence(draft);

    await this.prisma.draftEvolution.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }
}
