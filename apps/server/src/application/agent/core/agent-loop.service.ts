import { Injectable, Logger } from "@nestjs/common";
import type { ChatMessage } from "@domain/clinical-chat/ports/chat-model.provider";
import { AiProviderRegistry } from "@domain/clinical-chat/ports/ai-provider-registry.port";
import type {
  AgentResponse,
  ToolContext,
  AgentToolCallRecord,
} from "@application/agent/interfaces";
import { ToolRegistryService } from "@application/agent/core/tool-registry.service";
import { ToolDispatcherService } from "@application/agent/core/tool-dispatcher.service";

export type AgentLoopInput = {
  messages: ChatMessage[];
  context: ToolContext;
  modelOverride?: string;
  maxTokens?: number;
  /** Default: 6 */
  maxIterations?: number;
};

const DEFAULT_MAX_ITERATIONS = 6;

@Injectable()
export class AgentLoopService {
  private readonly logger = new Logger(AgentLoopService.name);

  constructor(
    private readonly aiProviderRegistry: AiProviderRegistry,
    private readonly registry: ToolRegistryService,
    private readonly dispatcher: ToolDispatcherService,
  ) {}

  async run(input: AgentLoopInput): Promise<AgentResponse> {
    const maxIterations = input.maxIterations ?? DEFAULT_MAX_ITERATIONS;
    const provider = this.aiProviderRegistry.getChatProvider();
    const toolDefs = this.registry.toLLMDefinitions();

    const messages: ChatMessage[] = [...input.messages];
    const allToolCalls: AgentToolCallRecord[] = [];
    const proposalIds: string[] = [];
    let iterations = 0;

    while (iterations < maxIterations) {
      iterations++;

      const reply = await provider.generateChatReply({
        messages,
        maxTokens: input.maxTokens ?? 1024,
        modelOverride: input.modelOverride,
        tools: toolDefs.length > 0 ? toolDefs : undefined,
        toolChoice: toolDefs.length > 0 ? "auto" : undefined,
      });

      if (reply.finishReason !== "tool_use" || !reply.toolCalls?.length) {
        // Model finished — return its answer
        return {
          answer: reply.content,
          toolCalls: allToolCalls,
          proposalIds,
          totalIterations: iterations,
          finishReason: "end_turn",
        };
      }

      // Append assistant message with tool_calls (as plain content for history)
      messages.push({ role: "assistant", content: reply.content ?? "" });

      // Dispatch all tool calls in parallel
      const results = await this.dispatcher.dispatch(reply.toolCalls, input.context);

      for (const result of results) {
        allToolCalls.push(result.record);
        messages.push({
          role: "tool",
          content: result.output,
          toolCallId: result.toolCallId,
        });
      }

      this.logger.debug(
        `Iteration ${iterations}: dispatched ${results.length} tool(s) — ${results.map((r) => r.toolName).join(", ")}`,
      );
    }

    // Reached max iterations — ask model for a final answer without tools
    this.logger.warn(`AgentLoop hit maxIterations (${maxIterations}), forcing end_turn.`);
    const finalReply = await provider.generateChatReply({
      messages,
      maxTokens: input.maxTokens ?? 1024,
      modelOverride: input.modelOverride,
      // No tools — force end_turn
    });

    return {
      answer: finalReply.content,
      toolCalls: allToolCalls,
      proposalIds,
      totalIterations: iterations + 1,
      finishReason: "max_iterations",
    };
  }
}
