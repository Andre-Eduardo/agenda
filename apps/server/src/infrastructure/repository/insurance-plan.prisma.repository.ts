import { Injectable } from "@nestjs/common";
import { ClinicId } from "@domain/clinic/entities";
import { InsurancePlan, InsurancePlanId } from "@domain/insurance-plan/entities";
import { InsurancePlanRepository } from "@domain/insurance-plan/insurance-plan.repository";
import { InsurancePlanMapper } from "@infrastructure/mappers/insurance-plan.mapper";
import { PrismaProvider } from "@infrastructure/repository/prisma/prisma.provider";
import { PrismaRepository } from "@infrastructure/repository/prisma.repository";

@Injectable()
export class InsurancePlanPrismaRepository
  extends PrismaRepository
  implements InsurancePlanRepository
{
  constructor(
    readonly prismaProvider: PrismaProvider,
    private readonly mapper: InsurancePlanMapper,
  ) {
    super(prismaProvider);
  }

  async findById(id: InsurancePlanId): Promise<InsurancePlan | null> {
    const plan = await this.prisma.insurancePlan.findFirst({
      where: { id: id.toString(), deletedAt: null },
    });

    return plan === null ? null : this.mapper.toDomain(plan);
  }

  async findByClinicId(clinicId: ClinicId): Promise<InsurancePlan[]> {
    const plans = await this.prisma.insurancePlan.findMany({
      where: { clinicId: clinicId.toString(), deletedAt: null },
      orderBy: { name: "asc" },
    });

    return plans.map((p) => this.mapper.toDomain(p));
  }

  async save(plan: InsurancePlan): Promise<void> {
    const data = this.mapper.toPersistence(plan);

    await this.prisma.insurancePlan.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }
}
