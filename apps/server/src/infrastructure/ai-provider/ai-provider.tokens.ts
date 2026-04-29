/**
 * Tokens de injeção de dependência para providers de IA.
 *
 * Use estes tokens ao injetar providers nos services:
 *
 * @example
 * constructor(
 *   @Inject(CHAT_MODEL_PROVIDER_TOKEN) private readonly chatProvider: ChatModelProvider,
 *   @Inject(EMBEDDING_PROVIDER_TOKEN) private readonly embeddingProvider: EmbeddingProvider,
 * ) {}
 *
 * ─── COMO REGISTRAR UM PROVIDER REAL ────────────────────────────────────────
 * Em `AiProviderModule`, substitua `useClass: MockChatProvider` pelo provider real:
 *
 * {
 *   provide: CHAT_MODEL_PROVIDER_TOKEN,
 *   useClass: OpenAiChatProvider,  // ou AnthropicChatProvider, OpenRouterChatProvider
 * }
 *
 * Para seleção por variável de ambiente:
 * {
 *   provide: CHAT_MODEL_PROVIDER_TOKEN,
 *   useFactory: (config: ConfigService) => {
 *     switch (config.get('AI_CHAT_PROVIDER')) {
 *       case 'openai':    return new OpenAiChatProvider(config);
 *       case 'anthropic': return new AnthropicChatProvider(config);
 *       case 'openrouter': return new OpenRouterChatProvider(config);
 *       default:          return new MockChatProvider();
 *     }
 *   },
 *   inject: [ConfigService],
 * }
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const CHAT_MODEL_PROVIDER_TOKEN = "CHAT_MODEL_PROVIDER";
export const EMBEDDING_PROVIDER_TOKEN = "EMBEDDING_PROVIDER";
