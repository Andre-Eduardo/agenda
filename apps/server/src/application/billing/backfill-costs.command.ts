/**
 * backfill-costs.command.ts
 *
 * Recalcula costUsd para todos os registros de ClinicalChatInteractionLog
 * que têm promptTokens, completionTokens e modelId preenchidos mas costUsd = null.
 *
 * Uso:
 *   pnpm -F @agenda-app/server backfill:costs
 *   npx ts-node --swc src/application/billing/backfill-costs.command.ts
 *
 * Comportamento:
 * - Idempotente: pode ser rodado múltiplas vezes sem efeito colateral
 * - Processa em batches de 500 para não sobrecarregar o banco
 * - Loga: total processado, total atualizado, total ignorado (modelo não mapeado)
 */

import { PrismaClient } from "@prisma/client";
import { calculateCostUsd } from "../../ai/pricing/ai-pricing.config";

const BATCH_SIZE = 500;

async function run(): Promise<void> {
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();

    const total = await prisma.clinicalChatInteractionLog.count({
      where: {
        costUsd: null,
        promptTokens: { not: null },
        completionTokens: { not: null },
        modelId: { not: null },
      },
    });

    console.log(`[backfill] Found ${total} records to process.`);

    let offset = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    while (offset < total) {
      const batch = await prisma.clinicalChatInteractionLog.findMany({
        where: {
          costUsd: null,
          promptTokens: { not: null },
          completionTokens: { not: null },
          modelId: { not: null },
        },
        select: { id: true, modelId: true, promptTokens: true, completionTokens: true },
        skip: offset,
        take: BATCH_SIZE,
        orderBy: { createdAt: "asc" },
      });

      if (batch.length === 0) break;

      const updates: Array<{ id: string; costUsd: number }> = [];
      const skipped: string[] = [];

      for (const row of batch) {
        // TypeScript guards: these are guaranteed non-null by the WHERE clause above
        if (row.modelId == null || row.promptTokens == null || row.completionTokens == null) {
          skipped.push(row.id);

          continue;
        }

        const cost = calculateCostUsd(row.modelId, row.promptTokens, row.completionTokens);

        if (cost === null) {
          skipped.push(row.id);
        } else {
          updates.push({ id: row.id, costUsd: cost });
        }
      }

      // Apply updates in a transaction
      if (updates.length > 0) {
        await prisma.$transaction(
          updates.map((u) =>
            prisma.clinicalChatInteractionLog.update({
              where: { id: u.id },
              data: { costUsd: u.costUsd },
            }),
          ),
        );
      }

      totalUpdated += updates.length;
      totalSkipped += skipped.length;
      offset += batch.length;

      console.log(
        `[backfill] Batch ${Math.ceil(offset / BATCH_SIZE)}: updated=${updates.length} skipped=${skipped.length} (progress: ${offset}/${total})`,
      );
    }

    console.log("[backfill] Done.");
    console.log(`  Total processed : ${offset}`);
    console.log(`  Total updated   : ${totalUpdated}`);
    console.log(`  Total skipped   : ${totalSkipped} (model not in pricing table)`);
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((error: unknown) => {
  console.error("[backfill] Fatal error:", error);
  process.exit(1);
});
