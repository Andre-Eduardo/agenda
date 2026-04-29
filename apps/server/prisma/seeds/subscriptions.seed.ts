/**
 * Seed: Assinaturas de desenvolvimento.
 *
 * Para cada ClinicMember com role PROFESSIONAL existente no banco,
 * cria uma ProfessionalSubscription (planCode=CONSULTORIO) e um
 * UsageRecord zerado para o mês corrente.
 *
 * Idempotente — usa upsert por memberId.
 *
 * Run via: ts-node prisma/seeds/subscriptions.seed.ts
 */
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

function periodStart(year: number, month: number): Date {
  return new Date(year, month - 1, 1);
}

function periodEnd(year: number, month: number): Date {
  return new Date(year, month, 0, 23, 59, 59, 999);
}

export async function main() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const professionals = await prisma.clinicMember.findMany({
    where: { role: "PROFESSIONAL", deletedAt: null },
  });

  if (professionals.length === 0) {
    console.log("  Nenhum ClinicMember com role PROFESSIONAL encontrado — seed ignorado.");

    return;
  }

  for (const member of professionals) {
    // Upsert subscription
    const existing = await prisma.professionalSubscription.findUnique({
      where: { memberId: member.id },
    });

    let subscriptionId: string;

    if (existing) {
      subscriptionId = existing.id;
      console.log(`  ↺ Assinatura já existe para member ${member.id} — mantida`);
    } else {
      subscriptionId = randomUUID();
      await prisma.professionalSubscription.create({
        data: {
          id: subscriptionId,
          clinicId: member.clinicId,
          memberId: member.id,
          planCode: "CONSULTORIO",
          status: "ACTIVE",
          currentPeriodStart: periodStart(year, month),
          currentPeriodEnd: periodEnd(year, month),
          previousPlanCode: null,
          planChangedAt: null,
          createdAt: now,
          updatedAt: now,
        },
      });
      console.log(`  ✔ ProfessionalSubscription criada para member ${member.id}`);
    }

    // Upsert UsageRecord for current period
    const existingRecord = await prisma.usageRecord.findUnique({
      where: {
        usage_record_member_period_unique: {
          memberId: member.id,
          periodYear: year,
          periodMonth: month,
        },
      },
    });

    if (existingRecord) {
      console.log(`  ↺ UsageRecord ${year}-${month} já existe para member ${member.id} — mantido`);
    } else {
      await prisma.usageRecord.create({
        data: {
          id: randomUUID(),
          clinicId: member.clinicId,
          memberId: member.id,
          subscriptionId,
          periodYear: year,
          periodMonth: month,
          planCodeSnapshot: "CONSULTORIO",
          docsUploaded: 0,
          chatMessages: 0,
          clinicalImages: 0,
          storageHotGbUsed: 0,
          createdAt: now,
          updatedAt: now,
        },
      });
      console.log(`  ✔ UsageRecord ${year}-${month} criado para member ${member.id}`);
    }
  }
}

if (require.main === module) {
  main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
