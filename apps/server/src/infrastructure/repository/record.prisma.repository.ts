import { Injectable } from "@nestjs/common";
import * as PrismaClient from "@prisma/client";
import { Record, RecordId } from "@domain/record/entities/record.entity";
import {
  RecordRepository,
  RecordSearchFilter,
  RecordSortOptions,
} from "@domain/record/record.repository";
import { PaginatedList, Pagination } from "@domain/@shared/repository";
import { toEnumOrNull } from "@domain/@shared/utils";
import { RecordMapper } from "@infrastructure/mappers/record.mapper";
import { PrismaProvider } from "@infrastructure/repository/prisma/prisma.provider";
import { PrismaRepository } from "@infrastructure/repository/prisma.repository";

// Define a type that includes the relation
type RecordWithFiles = PrismaClient.Record & {
  files: PrismaClient.File[];
};

@Injectable()
export class RecordPrismaRepository extends PrismaRepository implements RecordRepository {
  constructor(
    readonly prismaProvider: PrismaProvider,
    private readonly mapper: RecordMapper,
  ) {
    super(prismaProvider);
  }

  async findById(id: RecordId): Promise<Record | null> {
    const record = await this.prisma.record.findUnique({
      where: {
        id: id.toString(),
      },
      include: {
        files: true,
      },
    });

    return record === null ? null : this.mapper.toDomain(record);
  }

  async delete(id: RecordId): Promise<void> {
    await this.prisma.record.delete({
      where: {
        id: id.toString(),
      },
    });
  }

  async search(
    pagination: Pagination<RecordSortOptions>,
    filter: RecordSearchFilter = {},
  ): Promise<PaginatedList<Record>> {
    const where: PrismaClient.Prisma.RecordWhereInput = {
      id: filter.ids ? { in: filter.ids.map((id) => id.toString()) } : undefined,
      description: filter.term ? { contains: filter.term, mode: "insensitive" } : undefined,
      clinicId: filter.clinicId ? filter.clinicId.toString() : undefined,
      patientId: filter.patientId ? filter.patientId.toString() : undefined,
      createdByMemberId: filter.createdByMemberId ? filter.createdByMemberId.toString() : undefined,
      responsibleProfessionalId: filter.responsibleProfessionalId
        ? filter.responsibleProfessionalId.toString()
        : undefined,
      appointmentId: filter.appointmentId ? filter.appointmentId.toString() : undefined,
      attendanceType: toEnumOrNull(PrismaClient.AttendanceType, filter.attendanceType) ?? undefined,
      clinicalStatus:
        toEnumOrNull(PrismaClient.ClinicalStatusTag, filter.clinicalStatus) ?? undefined,
      source: toEnumOrNull(PrismaClient.RecordSource, filter.source) ?? undefined,
      eventDate:
        filter.dateStart || filter.dateEnd
          ? {
              gte: filter.dateStart,
              lte: filter.dateEnd,
            }
          : undefined,
      deletedAt: null,
    };

    const [data, totalCount] = await Promise.all([
      this.prisma.record.findMany({
        where,
        include: { files: true },
        ...this.normalizePagination(pagination, { createdAt: "desc" }),
      }),
      this.prisma.record.count({ where }),
    ]);

    return {
      data: data.map((item) => this.mapper.toDomain(item as RecordWithFiles)),
      totalCount,
    };
  }

  async save(record: Record): Promise<void> {
    const data = this.mapper.toPersistence(record);
    const { files, ...recordData } = data;

    await this.prisma.record.upsert({
      where: { id: recordData.id },
      create: recordData,
      update: recordData,
    });
  }
}
