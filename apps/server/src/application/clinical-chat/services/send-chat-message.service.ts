import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException, PreconditionException} from '../../../domain/@shared/exceptions';
import {PatientId} from '../../../domain/patient/entities';
import {ProfessionalId} from '../../../domain/professional/entities';
import {
    PatientChatSessionId,
    PatientChatMessage,
    ChatMessageRole,
    ChatSessionStatus,
    ClinicalChatInteractionLog,
    ChatInteractionStatus,
    AiAgentProfileId,
} from '../../../domain/clinical-chat/entities';
import type {PatientFacts, CriticalContextEntry, TimelineEntry} from '../../../domain/clinical-chat/entities';
import {PatientChatSessionRepository} from '../../../domain/clinical-chat/patient-chat-session.repository';
import {PatientChatMessageRepository} from '../../../domain/clinical-chat/patient-chat-message.repository';
import {AiAgentProfileRepository} from '../../../domain/clinical-chat/ai-agent-profile.repository';
import {ClinicalChatInteractionLogRepository} from '../../../domain/clinical-chat/clinical-chat-interaction-log.repository';
import {AiProviderRegistry} from '../../../domain/clinical-chat/ports/ai-provider-registry.port';
import type {ChatMessage} from '../../../domain/clinical-chat/ports/chat-model.provider';
import {GetContextSnapshotService} from './get-context-snapshot.service';
import {RetrievePatientChunksService} from './retrieve-patient-chunks.service';
import {ApplicationService, Command} from '../../@shared/application.service';

export type SendChatMessageInput = {
    sessionId: PatientChatSessionId;
    /** Texto da mensagem do usuário */
    content: string;
    /** Quantidade máxima de chunks para recuperar (padrão: 8) */
    topK?: number;
    /** Score mínimo de relevância dos chunks (padrão: 0) */
    minScore?: number;
};

export type SendChatMessageOutput = {
    /** Mensagem do usuário persistida */
    userMessage: PatientChatMessage;
    /** Mensagem do assistente gerada e persistida */
    assistantMessage: PatientChatMessage;
    /** Log de auditoria da interação */
    interactionLog: ClinicalChatInteractionLog;
};

/**
 * Task 8 — Serviço principal de orquestração do chat clínico com IA.
 *
 * Fluxo de execução:
 * 1. Valida sessão (deve estar ACTIVE) e acesso ao paciente
 * 2. Resolve o perfil do agente clínico (da sessão ou padrão)
 * 3. Obtém snapshot clínico (ou reconstrói se necessário)
 * 4. Recupera chunks relevantes via RAG por patientId
 * 5. Monta o payload de mensagens (system + histórico + pergunta atual)
 * 6. Chama o provider de IA via interface abstrata (nunca SDK direto)
 * 7. Persiste mensagem do usuário + mensagem do assistente
 * 8. Persiste log de auditoria com metadados completos
 * 9. Retorna resposta estruturada
 *
 * REGRAS DE ISOLAMENTO (nunca podem ser violadas):
 * - Retrieval sempre filtrado por patientId — nunca mistura pacientes
 * - Resposta não é persistida como Record oficial
 * - Resposta não altera dados clínicos do paciente
 *
 * PONTO DE INTEGRAÇÃO FUTURA:
 * - Trocar `AiProviderRegistry` (via AiProviderModule) para usar provider real
 * - Ativar embeddings no EmbeddingProvider para busca semântica real
 * - Nenhuma alteração neste service será necessária
 */
@Injectable()
export class SendChatMessageService
    implements ApplicationService<SendChatMessageInput, SendChatMessageOutput>
{
    constructor(
        private readonly sessionRepository: PatientChatSessionRepository,
        private readonly messageRepository: PatientChatMessageRepository,
        private readonly agentProfileRepository: AiAgentProfileRepository,
        private readonly interactionLogRepository: ClinicalChatInteractionLogRepository,
        private readonly aiProviderRegistry: AiProviderRegistry,
        private readonly getSnapshotService: GetContextSnapshotService,
        private readonly retrieveChunksService: RetrievePatientChunksService
    ) {}

    async execute({payload}: Command<SendChatMessageInput>): Promise<SendChatMessageOutput> {
        const startedAt = Date.now();

        // ─── 1. Validar sessão ───────────────────────────────────────────────
        const session = await this.sessionRepository.findById(payload.sessionId);
        if (!session) {
            throw new ResourceNotFoundException('Chat session not found.', payload.sessionId.toString());
        }
        if (session.status !== ChatSessionStatus.ACTIVE) {
            throw new PreconditionException('Cannot send message to a non-active session.');
        }

        const patientId = session.patientId as PatientId;
        // O professionalId vem da sessão — foi validado no momento da criação
        const professionalId = session.professionalId as ProfessionalId;

        // ─── 2. Resolver perfil do agente ────────────────────────────────────
        const agentProfile = session.agentProfileId
            ? await this.agentProfileRepository.findById(session.agentProfileId as AiAgentProfileId)
            : await this.resolveDefaultAgentProfile();

        // ─── 3. Obter snapshot clínico ───────────────────────────────────────
        const {snapshot} = await this.getSnapshotService.execute({
            patientId,
            professionalId,
            autoRebuildIfStale: true,
        });

        // ─── 4. Recuperar chunks via RAG (filtrado por patientId) ─────────────
        const retrievalResult = await this.retrieveChunksService.execute({
            patientId,
            query: payload.content,
            topK: payload.topK ?? 8,
            minScore: payload.minScore ?? 0,
            sourceTypes: agentProfile?.allowedSources?.length
                ? (agentProfile.allowedSources as any[])
                : undefined,
        });

        const retrievedChunkIds = retrievalResult.chunks.map((c) => c.id);

        // ─── 5. Buscar histórico recente da conversa ─────────────────────────
        // Busca as últimas 10 mensagens (USER/ASSISTANT) para o histórico de contexto
        const recentMessagesResult = await this.messageRepository.listBySession(
            payload.sessionId,
            {limit: 10, sort: [{key: 'createdAt', direction: 'desc'}]}
        );
        const recentMessages = recentMessagesResult.data.filter(
            (m) => m.role === ChatMessageRole.USER || m.role === ChatMessageRole.ASSISTANT
        );

        // ─── 6. Montar payload de mensagens ──────────────────────────────────
        const messages = this.buildMessagePayload({
            agentInstructions: agentProfile?.baseInstructions ?? null,
            patientFacts: snapshot?.patientFacts ?? null,
            criticalContext: snapshot?.criticalContext ?? null,
            timelineSummary: snapshot?.timelineSummary ?? null,
            retrievedChunks: retrievalResult.chunks,
            recentMessages,
            userQuestion: payload.content,
        });

        // ─── 7. Criar log de interação (PENDING) ──────────────────────────────
        const interactionLog = ClinicalChatInteractionLog.create({
            sessionId: payload.sessionId,
            userMessageId: '', // será preenchido após persistência da mensagem
            assistantMessageId: null,
            agentProfileId: agentProfile?.id ?? null,
            agentSlug: agentProfile?.slug ?? null,
            snapshotId: snapshot?.id ?? null,
            snapshotVersion: snapshot?.contentHash ?? null,
            retrievedChunkIds,
            status: ChatInteractionStatus.PENDING,
        });

        // ─── 8. Persistir mensagem do usuário ────────────────────────────────
        const userMessage = PatientChatMessage.create({
            sessionId: payload.sessionId,
            role: ChatMessageRole.USER,
            content: payload.content,
            metadata: null,
            chunkIds: [],
        });
        await this.messageRepository.save(userMessage);

        // Atualiza o log com o ID real da mensagem do usuário
        interactionLog.userMessageId = userMessage.id.toString();

        // ─── 9. Chamar provider abstrato (nunca SDK direto) ──────────────────
        const provider = this.aiProviderRegistry.getChatProvider();
        let replyContent: string;
        let replyMetadata: Record<string, unknown>;
        let usedFallback = false;

        try {
            const reply = await provider.generateChatReply({messages, maxTokens: 1024});

            replyContent = reply.content || '(sem resposta gerada)';
            replyMetadata = {
                provider: provider.providerId,
                model: provider.modelId,
                finishReason: reply.finishReason,
                usage: reply.usage,
                agentSlug: agentProfile?.slug ?? null,
                snapshotVersion: snapshot?.contentHash ?? null,
                chunksUsed: retrievedChunkIds.length,
                mock: provider.providerId === 'mock',
            };

            // ─── 10. Persistir mensagem do assistente ─────────────────────────
            const assistantMessage = PatientChatMessage.create({
                sessionId: payload.sessionId,
                role: ChatMessageRole.ASSISTANT,
                content: replyContent,
                metadata: replyMetadata,
                chunkIds: retrievedChunkIds,
            });
            await this.messageRepository.save(assistantMessage);

            // ─── 11. Atualizar timestamp da sessão ───────────────────────────
            session.touch();
            await this.sessionRepository.save(session);

            // ─── 12. Completar log de auditoria ──────────────────────────────
            const latencyMs = Date.now() - startedAt;
            interactionLog.complete({
                assistantMessageId: assistantMessage.id.toString(),
                providerId: provider.providerId,
                modelId: provider.modelId,
                promptTokens: reply.usage.promptTokens,
                completionTokens: reply.usage.completionTokens,
                totalTokens: reply.usage.totalTokens,
                latencyMs,
                usedFallback,
            });
            await this.interactionLogRepository.save(interactionLog);

            return {userMessage, assistantMessage, interactionLog};
        } catch (error) {
            // ─── Tratamento de falha do provider ─────────────────────────────
            const errorMessage = error instanceof Error ? error.message : 'Unknown provider error';
            interactionLog.fail('PROVIDER_ERROR', errorMessage);
            await this.interactionLogRepository.save(interactionLog);

            // Re-lança para que o controller retorne erro estruturado
            throw error;
        }
    }

    /** Retorna o primeiro agente genérico ativo (specialty=null) ou o primeiro ativo encontrado. */
    private async resolveDefaultAgentProfile() {
        const profiles = await this.agentProfileRepository.findAllActive();
        return profiles.find((p) => p.specialty === null) ?? profiles[0] ?? null;
    }

    /**
     * Monta o array de mensagens para o provider de IA.
     *
     * Estrutura:
     * 1. System message: instruções do agente + contexto clínico estruturado
     * 2. Mensagens do histórico recente (USER + ASSISTANT)
     * 3. Mensagem atual do usuário
     *
     * O system message condensa:
     * - baseInstructions do AiAgentProfile
     * - patientFacts (dados demográficos, condições, medicamentos)
     * - criticalContext (alertas, alergias — sempre visível)
     * - timelineSummary (eventos recentes)
     * - chunks recuperados via RAG (conteúdo semântico relevante)
     */
    private buildMessagePayload(params: {
        agentInstructions: string | null;
        patientFacts: PatientFacts | null;
        criticalContext: CriticalContextEntry[] | null;
        timelineSummary: TimelineEntry[] | null;
        retrievedChunks: Array<{content: string; sourceType: string; sourceId: string; score: number}>;
        recentMessages: PatientChatMessage[];
        userQuestion: string;
    }): ChatMessage[] {
        const systemParts: string[] = [];

        // Instruções base do agente
        if (params.agentInstructions) {
            systemParts.push('# Instruções do Assistente\n' + params.agentInstructions);
        } else {
            systemParts.push(
                '# Instruções do Assistente\n' +
                    'Você é um assistente clínico auxiliar. ' +
                    'Apoie o profissional de saúde com informações contextuais sobre o paciente. ' +
                    'Nunca sugira diagnósticos definitivos. ' +
                    'Não altere dados clínicos. ' +
                    'Respostas sempre fundamentadas no contexto fornecido.'
            );
        }

        // Contexto crítico (sempre incluído quando presente)
        if (params.criticalContext && params.criticalContext.length > 0) {
            const criticalLines = params.criticalContext
                .map((c) => `- [${c.severity}] ${c.title}${c.description ? ': ' + c.description : ''}`)
                .join('\n');
            systemParts.push('# ATENÇÃO — Contexto Crítico\n' + criticalLines);
        }

        // Facts estruturados do paciente
        if (params.patientFacts) {
            const facts = params.patientFacts;
            const factsLines: string[] = [];

            if (facts.name) factsLines.push(`Nome: ${facts.name}`);
            if (facts.age !== null && facts.age !== undefined) factsLines.push(`Idade: ${facts.age} anos`);
            if (facts.gender) factsLines.push(`Gênero: ${facts.gender}`);
            if (facts.allergies) factsLines.push(`Alergias: ${facts.allergies}`);
            if (facts.chronicConditions) factsLines.push(`Condições crônicas: ${facts.chronicConditions}`);
            if (facts.currentMedications) factsLines.push(`Medicamentos em uso: ${facts.currentMedications}`);
            if (facts.surgicalHistory) factsLines.push(`Histórico cirúrgico: ${facts.surgicalHistory}`);
            if (facts.familyHistory) factsLines.push(`Histórico familiar: ${facts.familyHistory}`);
            if (facts.socialHistory) factsLines.push(`Histórico social: ${facts.socialHistory}`);

            if (factsLines.length > 0) {
                systemParts.push('# Dados do Paciente\n' + factsLines.join('\n'));
            }
        }

        // Timeline resumida
        if (params.timelineSummary && params.timelineSummary.length > 0) {
            const timelineLines = params.timelineSummary
                .slice(0, 5) // Limita para não explodir o contexto
                .map((t) => `- [${t.date.split('T')[0]}] ${t.title ?? t.type}${t.summary ? ': ' + t.summary.slice(0, 120) : ''}`)
                .join('\n');
            systemParts.push('# Eventos Recentes\n' + timelineLines);
        }

        // Chunks recuperados via RAG
        if (params.retrievedChunks.length > 0) {
            const chunksText = params.retrievedChunks
                .map((c, i) => `[Fonte ${i + 1} — ${c.sourceType}]\n${c.content}`)
                .join('\n\n---\n\n');
            systemParts.push('# Contexto Clínico Recuperado\n' + chunksText);
        }

        const systemContent = systemParts.join('\n\n---\n\n');

        const messages: ChatMessage[] = [{role: 'system', content: systemContent}];

        // Histórico recente (ordenado cronologicamente — mais antigo primeiro)
        for (const msg of [...params.recentMessages].reverse()) {
            if (msg.role === ChatMessageRole.USER) {
                messages.push({role: 'user', content: msg.content});
            } else if (msg.role === ChatMessageRole.ASSISTANT) {
                messages.push({role: 'assistant', content: msg.content});
            }
        }

        // Mensagem atual do usuário
        messages.push({role: 'user', content: params.userQuestion});

        return messages;
    }
}
