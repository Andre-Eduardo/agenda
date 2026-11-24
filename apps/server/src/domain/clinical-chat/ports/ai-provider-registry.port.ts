import type {ClinicId} from '@domain/clinic/entities';
import type {ChatModelProvider} from '@domain/clinical-chat/ports/chat-model.provider';
import type {EmbeddingProvider} from '@domain/clinical-chat/ports/embedding.provider';

/**
 * Registry centralizado para gerenciar providers de IA.
 *
 * Permite que serviços de negócio obtenham o provider correto
 * sem conhecer qual implementação está ativa.
 *
 * Pode ser estendido futuramente para:
 * - Suporte a múltiplos providers com fallback automático
 * - Seleção dinâmica de provider por contexto (especialidade, custo, latência)
 * - Circuit breaker por provider
 */
export interface AiProviderRegistry {
    /** Retorna o provider de chat configurado para uso principal. */
    /** Provider de chat que só responde para clínica com pacote de IA; `null` = uso da plataforma. */
    getChatProvider(clinicId: ClinicId | null): ChatModelProvider;

    /** Retorna o provider de embeddings configurado. */
    /** Provider de embedding que só responde para clínica com pacote de IA; `null` = uso da plataforma. */
    getEmbeddingProvider(clinicId: ClinicId | null): EmbeddingProvider;

    /** Lista IDs de todos os providers registrados (útil para diagnóstico). */
    listRegisteredProviders(): string[];

    /** Verifica saúde de todos os providers registrados. */
    healthCheckAll(): Promise<Record<string, boolean>>;
}

/** Token abstrato para injeção de dependência no NestJS */
export abstract class AiProviderRegistry {}
