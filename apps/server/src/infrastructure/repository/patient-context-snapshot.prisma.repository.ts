import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { ClinicMemberId } from "@domain/clinic-member/entities";
import { PatientContextSnapshot, PatientContextSnapshotId } from "@domain/clinical-chat/entities";
import { PatientContextSnapshotRepository } from "@domain/clinical-chat/patient-context-snapshot.repository";
import type { PatientId } from "@domain/patient/entities";
import { PatientContextSnapshotMapper } from "@infrastructure/mappers/patient-context-snapshot.mapper";
import { PrismaProvider } from "@infrastructure/repository/prisma/prisma.provider";
import { PrismaRepository } from "@infrastructure/repository/prisma.repository";

@Injectable()
export class PatientContextSnapshotPrismaRepository
  extends PrismaRepository
  implements PatientContextSnapshotRepository
{
  constructor(
    readonly prismaProvider: PrismaProvider,
    private readonly mapper: PatientContextSnapshotMapper,
  ) {
    super(prismaProvider);
  }

  async findById(id: PatientContextSnapshotId): Promise<PatientContextSnapshot | null> {
    const record = await this.prisma.patientContextSnapshot.findUnique({
      where: { id: id.toString() },
    });

    return record ? this.mapper.toDomain(record) : null;
  }

  async findByPatient(
    patientId: PatientId,
    memberId?: ClinicMemberId | null,
  ): Promise<PatientContextSnapshot | null> {
    const record = await this.prisma.patientContextSnapshot.findFirst({
      where: {
        patientId: patientId.toString(),
        memberId: memberId ? memberId.toString() : null,
      },
      orderBy: { updatedAt: "desc" },
    });

    return record ? this.mapper.toDomain(record) : null;
  }

  async save(snapshot: PatientContextSnapshot): Promise<void> {
    const data = this.mapper.toPersistence(snapshot);
    const writeData: Prisma.PatientContextSnapshotUncheckedCreateInput = {
      ...data,
      patientFacts: data.patientFacts as Prisma.InputJsonValue,
      criticalContext:
        data.criticalContext === null
          ? Prisma.JsonNull
          : (data.criticalContext as Prisma.InputJsonValue),
      timelineSummary:
        data.timelineSummary === null
          ? Prisma.JsonNull
          : (data.timelineSummary as Prisma.InputJsonValue),
    };

    await this.prisma.patientContextSnapshot.upsert({
      where: { id: data.id },
      create: writeData,
      update: writeData,
    });
  }
}
