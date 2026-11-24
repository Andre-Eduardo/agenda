import {AccessDeniedException, AccessDeniedReason} from '@domain/@shared/exceptions';
import {ModuleType} from '@domain/clinic-license/models';
import type {ModuleAccess} from '@domain/clinic-license/services';
import type {ClinicId} from '@domain/clinic/entities';
import type {
    ChatModelProvider,
    ChatReplyInput,
    ChatReplyOutput,
    HealthCheckResult,
    ProviderCapabilities,
    UsageEstimate,
} from '@domain/clinical-chat/ports/chat-model.provider';
import type {EmbeddingProvider} from '@domain/clinical-chat/ports/embedding.provider';

const AI_MODULES = Object.values(ModuleType);

/**
 * Última barreira: nenhuma chamada paga ao provedor sai para uma clínica sem pacote de IA,
 * mesmo que um endpoint ou job novo esqueça de checar. `null` = uso da plataforma (base de
 * conhecimento global), sem clínica a cobrar.
 */
async function assertClinicHasAi(moduleAccess: ModuleAccess, clinicId: ClinicId | null): Promise<void> {
    if (clinicId === null) return;

    if (!(await moduleAccess.isClinicModuleEnabled(clinicId, ...AI_MODULES))) {
        throw new AccessDeniedException(
            `Clinic ${clinicId.toString()} has no AI module.`,
            AccessDeniedReason.MODULE_NOT_ENABLED
        );
    }
}

export class ModuleGuardedChatProvider implements ChatModelProvider {
    constructor(
        private readonly provider: ChatModelProvider,
        private readonly moduleAccess: ModuleAccess,
        private readonly clinicId: ClinicId | null
    ) {}

    get providerId(): string {
        return this.provider.providerId;
    }

    get modelId(): string {
        return this.provider.modelId;
    }

    async generateChatReply(input: ChatReplyInput): Promise<ChatReplyOutput> {
        await assertClinicHasAi(this.moduleAccess, this.clinicId);

        return this.provider.generateChatReply(input);
    }

    estimateUsage(input: ChatReplyInput): Promise<UsageEstimate> {
        return this.provider.estimateUsage(input);
    }

    listCapabilities(): ProviderCapabilities {
        return this.provider.listCapabilities();
    }

    healthCheck(): Promise<HealthCheckResult> {
        return this.provider.healthCheck();
    }
}

export class ModuleGuardedEmbeddingProvider implements EmbeddingProvider {
    constructor(
        private readonly provider: EmbeddingProvider,
        private readonly moduleAccess: ModuleAccess,
        private readonly clinicId: ClinicId | null
    ) {}

    get providerId(): string {
        return this.provider.providerId;
    }

    get dimensions(): number {
        return this.provider.dimensions;
    }

    async generateEmbedding(text: string): Promise<number[]> {
        await assertClinicHasAi(this.moduleAccess, this.clinicId);

        return this.provider.generateEmbedding(text);
    }

    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        await assertClinicHasAi(this.moduleAccess, this.clinicId);

        return this.provider.generateEmbeddings(texts);
    }

    vectorDimensions(): number {
        return this.provider.vectorDimensions();
    }

    healthCheck(): Promise<{healthy: boolean; latencyMs?: number; message?: string}> {
        return this.provider.healthCheck();
    }
}
