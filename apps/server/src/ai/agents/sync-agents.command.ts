/**
 * sync-agents.command.ts
 *
 * Script standalone para sincronizar AiAgentProfile no banco a partir do AGENT_REGISTRY.
 *
 * Uso:
 *   pnpm -F @agenda-app/server sync:agents
 *   npx ts-node -r tsconfig-paths/register src/ai/agents/sync-agents.command.ts
 *
 * Comportamento:
 * - Upsert por slug: cria se não existir, atualiza se o modelo ou instruções mudaram
 * - NUNCA deleta registros com sessões vinculadas
 * - Loga claramente o que foi criado, atualizado ou ignorado
 */

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { AGENT_REGISTRY, SPECIALTY_AGENT_MAP } from "./agent.config";
import { AiSpecialtyGroup } from "@domain/form-template/entities";

const prisma = new PrismaClient();

function specialtyGroupForSlug(slug: string): AiSpecialtyGroup | null {
  const entry = (Object.entries(SPECIALTY_AGENT_MAP) as Array<[AiSpecialtyGroup, string]>).find(
    ([, s]) => s === slug,
  );

  return entry?.[0] ?? null;
}

async function syncAgents(): Promise<void> {
  console.log("=== sync:agents — sincronizando AGENT_REGISTRY → banco ===\n");

  const slugsWithSessions = new Set<string>();

  const sessionsWithAgents = await prisma.patientChatSession.findMany({
    where: { agentProfileId: { not: null } },
    include: { agentProfile: { select: { slug: true } } },
  });

  for (const session of sessionsWithAgents) {
    if (session.agentProfile?.slug) {
      slugsWithSessions.add(session.agentProfile.slug);
    }
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const config of Object.values(AGENT_REGISTRY)) {
    const existing = await prisma.aiAgentProfile.findUnique({
      where: { slug: config.slug },
    });

    const specialtyGroup = specialtyGroupForSlug(config.slug);

    if (!existing) {
      const now = new Date();

      await prisma.aiAgentProfile.create({
        data: {
          id: randomUUID(),
          name: config.name,
          slug: config.slug,
          code: config.slug.replaceAll("-", "_"),
          specialtyGroup: specialtyGroup ?? null,
          baseInstructions: config.baseInstructions,
          guardrails: config.guardrails,
          analysisGoals: config.analysisGoals,
          allowedSources: config.allowedSources,
          contextPriority: config.contextPriority,
          providerModelId: config.providerModelId,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      });
      console.log(`  [CRIADO]    ${config.slug}  (modelo: ${config.providerModelId})`);
      created++;
    } else {
      const modelChanged = existing.providerModelId !== config.providerModelId;
      const instructionsChanged = existing.baseInstructions !== config.baseInstructions;

      if (modelChanged || instructionsChanged) {
        await prisma.aiAgentProfile.update({
          where: { slug: config.slug },
          data: {
            name: config.name,
            baseInstructions: config.baseInstructions,
            guardrails: config.guardrails,
            analysisGoals: config.analysisGoals,
            allowedSources: config.allowedSources,
            contextPriority: config.contextPriority,
            providerModelId: config.providerModelId,
            updatedAt: new Date(),
          },
        });
        const changes: string[] = [];

        if (modelChanged)
          changes.push(`modelo: ${existing.providerModelId ?? "null"} → ${config.providerModelId}`);

        if (instructionsChanged) changes.push("instruções atualizadas");
        console.log(`  [ATUALIZADO] ${config.slug}  (${changes.join(", ")})`);
        updated++;
      } else {
        console.log(`  [IGNORADO]  ${config.slug}  (sem alterações)`);
        skipped++;
      }
    }
  }

  console.log(
    `\n=== Concluído: ${created} criados, ${updated} atualizados, ${skipped} ignorados ===`,
  );

  if (slugsWithSessions.size > 0) {
    console.log(
      `\nNota: ${slugsWithSessions.size} agente(s) com sessões vinculadas foram preservados:`,
    );

    for (const slug of slugsWithSessions) {
      console.log(`  - ${slug}`);
    }
  }
}

syncAgents()
  .catch((error) => {
    console.error("Erro ao sincronizar agentes:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
