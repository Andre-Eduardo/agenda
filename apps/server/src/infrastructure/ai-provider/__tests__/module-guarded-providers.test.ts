import {mock} from 'jest-mock-extended';
import {AccessDeniedException} from '@domain/@shared/exceptions';
import type {ModuleAccess} from '@domain/clinic-license/services';
import {ClinicId} from '@domain/clinic/entities';
import type {ChatModelProvider, ChatReplyInput} from '@domain/clinical-chat/ports/chat-model.provider';
import type {EmbeddingProvider} from '@domain/clinical-chat/ports/embedding.provider';
import {DefaultAiProviderRegistry} from '@infrastructure/ai-provider/ai-provider-registry';

const input = mock<ChatReplyInput>();

function setup(hasAi: boolean) {
    const chat = mock<ChatModelProvider>({providerId: 'mock', modelId: 'm1'});
    const embedding = mock<EmbeddingProvider>({providerId: 'mock-embedding', dimensions: 3});
    const moduleAccess = mock<ModuleAccess>();

    moduleAccess.isClinicModuleEnabled.mockResolvedValue(hasAi);
    chat.generateChatReply.mockResolvedValue(mock());
    embedding.generateEmbedding.mockResolvedValue([1, 2, 3]);
    embedding.generateEmbeddings.mockResolvedValue([[1, 2, 3]]);

    return {chat, embedding, moduleAccess, registry: new DefaultAiProviderRegistry(chat, embedding, moduleAccess)};
}

describe('AI providers guarded by module', () => {
    it('refuse paid calls for a clinic without AI module', async () => {
        const {chat, embedding, registry} = setup(false);
        const clinicId = ClinicId.generate();

        await expect(registry.getChatProvider(clinicId).generateChatReply(input)).rejects.toThrow(
            AccessDeniedException
        );
        await expect(registry.getEmbeddingProvider(clinicId).generateEmbedding('x')).rejects.toThrow(
            AccessDeniedException
        );
        await expect(registry.getEmbeddingProvider(clinicId).generateEmbeddings(['x'])).rejects.toThrow(
            AccessDeniedException
        );
        expect(chat.generateChatReply).not.toHaveBeenCalled();
        expect(embedding.generateEmbedding).not.toHaveBeenCalled();
        expect(embedding.generateEmbeddings).not.toHaveBeenCalled();
    });

    it('delegate for a clinic with AI module and for platform calls', async () => {
        const {chat, embedding, moduleAccess, registry} = setup(true);

        await registry.getChatProvider(ClinicId.generate()).generateChatReply(input);
        await expect(registry.getEmbeddingProvider(null).generateEmbedding('x')).resolves.toEqual([1, 2, 3]);
        await expect(registry.getEmbeddingProvider(ClinicId.generate()).generateEmbeddings(['x'])).resolves.toEqual([
            [1, 2, 3],
        ]);

        expect(chat.generateChatReply).toHaveBeenCalledWith(input);
        expect(embedding.generateEmbedding).toHaveBeenCalledWith('x');
        expect(moduleAccess.isClinicModuleEnabled).toHaveBeenCalledTimes(2);
    });

    it('expose the wrapped provider metadata without checking modules', async () => {
        const {chat, embedding, moduleAccess, registry} = setup(false);
        const chatProvider = registry.getChatProvider(ClinicId.generate());
        const embeddingProvider = registry.getEmbeddingProvider(ClinicId.generate());

        chat.listCapabilities.mockReturnValue(mock());
        embedding.vectorDimensions.mockReturnValue(3);

        expect(chatProvider.providerId).toBe('mock');
        expect(chatProvider.modelId).toBe('m1');
        expect(embeddingProvider.providerId).toBe('mock-embedding');
        expect(embeddingProvider.dimensions).toBe(3);
        expect(embeddingProvider.vectorDimensions()).toBe(3);
        chatProvider.listCapabilities();
        await chatProvider.estimateUsage(input);
        await chatProvider.healthCheck();
        await embeddingProvider.healthCheck();

        expect(chat.estimateUsage).toHaveBeenCalledWith(input);
        expect(chat.healthCheck).toHaveBeenCalled();
        expect(embedding.healthCheck).toHaveBeenCalled();
        expect(moduleAccess.isClinicModuleEnabled).not.toHaveBeenCalled();
    });
});
