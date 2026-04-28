import {Injectable} from '@nestjs/common';
import {PreconditionException} from '../../../domain/@shared/exceptions';
import {PatientId} from '../../../domain/patient/entities';
import type {PatientFacts} from '../../../domain/clinical-chat/entities';

/**
 * Política de contexto efetiva para um agente clínico.
 *
 * Define explicitamente o que entra e o que não entra no contexto
 * enviado ao modelo, evitando mistura de pacientes e dados irrelevantes.
 */
export type ContextPolicy = {
    /**
     * Tipos de fonte de contexto permitidos para este agente.
     * Vazio = todos os tipos são permitidos.
     * Ex: ["RECORD", "CLINICAL_PROFILE", "PATIENT_FORM"]
     */
    allowedSources: string[];

    /**
     * Campos de PatientFacts que devem ser removidos antes de montar o prompt.
     * Garante que campos administrativos, PII desnecessários ou identificadores
     * não clínicos não trafeguem para o LLM.
     * Ex: ["documentId", "birthDate"] para agentes que não precisam desses dados.
     */
    blacklistedFields: string[];

    /**
     * Chunks com eventDate anterior a esta data são excluídos do contexto.
     * null = sem filtro de data (todo o histórico é permitido).
     * Ex: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) para último ano.
     */
    minDate: Date | null;
};

/**
 * Shape mínimo de chunk aceito pelo filtro de política.
 * Compatível com o retorno de RetrievePatientChunksService.
 */
export type PolicyChunk = {
    id: string;
    sourceType: string;
    metadata: Record<string, unknown> | null;
    [key: string]: unknown;
};

/**
 * Task 14 — ContextPolicyService
 *
 * Serviço responsável por aplicar regras explícitas de inclusão/exclusão
 * no contexto clínico enviado ao modelo de IA.
 *
 * Regras garantidas por código (não apenas por comentário):
 * 1. patientId é SEMPRE obrigatório — nunca há RAG sem filtro de paciente.
 * 2. allowedSources define quais tipos de chunk cada agente pode receber.
 * 3. blacklistedFields remove campos de PatientFacts antes de montar o prompt.
 * 4. minDate exclui registros muito antigos quando configurado.
 *
 * Uso típico:
 *   1. ContextPolicyService.assertPatientIdRequired(patientId) — no início de cada RAG
 *   2. ContextPolicyService.buildEffectivePolicy({...agentProfile}) — monta a política
 *   3. ContextPolicyService.applyToChunks(chunks, policy) — filtra chunks recuperados
 *   4. ContextPolicyService.sanitizePatientFacts(facts, policy.blacklistedFields) — limpa facts
 */
@Injectable()
export class ContextPolicyService {
    /**
     * Lança PreconditionException se patientId for nulo, indefinido ou inválido.
     *
     * Deve ser chamado no início de TODA operação de RAG ou montagem de contexto.
     * Garante em tempo de execução que o isolamento por paciente é sempre aplicado,
     * mesmo que tipos TypeScript sejam contornados (ex.: casts explícitos).
     *
     * @throws PreconditionException se patientId estiver ausente ou inválido
     */
    assertPatientIdRequired(patientId: PatientId | null | undefined): void {
        if (!patientId || !patientId.toString().trim()) {
            throw new PreconditionException(
                'patientId é obrigatório: o RAG e o contexto clínico nunca devem ser ' +
                    'executados sem filtro de paciente. Forneça um patientId válido.',
            );
        }
    }

    /**
     * Constrói a política de contexto efetiva para um agente.
     *
     * Centraliza a lógica de construção da política a partir dos parâmetros
     * do AiAgentProfile, garantindo defaults seguros.
     */
    buildEffectivePolicy(params: {
        allowedSources?: string[];
        blacklistedFields?: string[];
        minDate?: Date | null;
    }): ContextPolicy {
        return {
            allowedSources: params.allowedSources ?? [],
            blacklistedFields: params.blacklistedFields ?? [],
            minDate: params.minDate ?? null,
        };
    }

    /**
     * Filtra um array de chunks de acordo com a política do agente:
     *
     * 1. allowedSources — remove chunks cujo sourceType não está na lista permitida.
     *    (Filtro duplo: o repositório já filtra na query, este é a salvaguarda no domínio.)
     * 2. minDate — remove chunks com metadata.eventDate anterior à data mínima.
     *    Chunks sem eventDate no metadata são mantidos (ex: alertas sem data específica).
     *
     * @param chunks - Chunks recuperados pelo RetrievePatientChunksService
     * @param policy - Política efetiva do agente
     * @returns Subconjunto de chunks que passa pela política
     */
    applyToChunks<T extends PolicyChunk>(chunks: T[], policy: ContextPolicy): T[] {
        let filtered = [...chunks];

        // ─── 1. Filtrar por allowedSources ───────────────────────────────────
        // Vazio = todos os tipos são permitidos (sem restrição de fonte)
        if (policy.allowedSources.length > 0) {
            filtered = filtered.filter((c) => policy.allowedSources.includes(c.sourceType));
        }

        // ─── 2. Filtrar por minDate usando metadata.eventDate ─────────────────
        if (policy.minDate !== null) {
            const minTime = policy.minDate.getTime();

            filtered = filtered.filter((c) => {
                const rawDate = c.metadata?.['eventDate'];

                if (rawDate == null) {
                    // Chunks sem data (ex: alertas, perfil clínico) são sempre mantidos
                    return true;
                }

                return new Date(String(rawDate)).getTime() >= minTime;
            });
        }

        return filtered;
    }

    /**
     * Remove campos bloqueados de PatientFacts antes de montar o prompt do LLM.
     *
     * Garante que:
     * - Campos administrativos (ex: documentId) não trafeguem para o modelo quando
     *   o agente não precisa deles para sua função clínica.
     * - Campos de PII excessivos possam ser suprimidos por agente/especialidade.
     * - A política é auditável — quais campos foram removidos fica explícito no código.
     *
     * @param facts - PatientFacts completos vindos do snapshot
     * @param blacklistedFields - Lista de chaves a remover (ex: ["documentId", "birthDate"])
     * @returns Cópia de facts sem os campos bloqueados
     */
    sanitizePatientFacts(facts: PatientFacts, blacklistedFields: string[]): PatientFacts {
        if (blacklistedFields.length === 0) {
            return facts;
        }

        const sanitized: Record<string, unknown> = {...(facts as unknown as Record<string, unknown>)};

        for (const field of blacklistedFields) {
            delete sanitized[field];
        }

        return sanitized as PatientFacts;
    }
}
