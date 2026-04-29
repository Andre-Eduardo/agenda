import { Injectable } from "@nestjs/common";
import { RecordAmendment } from "@domain/record/entities/record-amendment.entity";
import { RecordId } from "@domain/record/entities/record.entity";
import { RecordAmendmentRepository } from "@domain/record/record-amendment.repository";
import { RecordAmendmentMapper } from "@infrastructure/mappers/record-amendment.mapper";
import { PrismaProvider } from "@infrastructure/repository/prisma/prisma.provider";
import { PrismaRepository } from "@infrastructure/repository/prisma.repository";

@Injectable()
export class RecordAmendmentPrismaRepository
  extends PrismaRepository
  implements RecordAmendmentRepository
{
  constructor(
    readonly prismaProvider: PrismaProvider,
    private readonly mapper: RecordAmendmentMapper,
  ) {
    super(prismaProvider);
  }

  async findAllByRecordId(recordId: RecordId): Promise<RecordAmendment[]> {
    const amendments = await this.prisma.recordAmendment.findMany({
      where: { recordId: recordId.toString() },
      orderBy: { reopenedAt: "desc" },
    });

    return amendments.map((a) => this.mapper.toDomain(a));
  }

  async save(amendment: RecordAmendment): Promise<void> {
    const data = this.mapper.toPersistence(amendment);

    await this.prisma.recordAmendment.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }
}
