import {Injectable, Logger} from '@nestjs/common';
import type {LLMToolCall} from '@domain/clinical-chat/ports';
import type {AgentToolCallRecord} from '../interfaces';
import type {ToolContext} from '../interfaces';
import {ToolRegistryService} from './tool-registry.service';

export type DispatchResult = {
    toolCallId: string;
    toolName: string;
    output: string;
    record: AgentToolCallRecord;
};

@Injectable()
export class ToolDispatcherService {
    private readonly logger = new Logger(ToolDispatcherService.name);

    constructor(private readonly registry: ToolRegistryService) {}

    async dispatch(toolCalls: LLMToolCall[], context: ToolContext): Promise<DispatchResult[]> {
        return Promise.all(
            toolCalls.map(async (tc) => {
                const tool = this.registry.getByName(tc.name);
                const start = Date.now();

                if (!tool) {
                    const error = `Tool "${tc.name}" not found in registry.`;

                    this.logger.warn(error);
                    const record: AgentToolCallRecord = {
                        tool: tc.name,
                        input: tc.arguments,
                        output: null,
                        durationMs: 0,
                        error,
                    };

                    return {toolCallId: tc.id, toolName: tc.name, output: JSON.stringify({error}), record};
                }

                try {
                    const parsed = tool.inputSchema.parse(tc.arguments);
                    const output = await tool.execute(parsed, context);
                    const durationMs = Date.now() - start;
                    const record: AgentToolCallRecord = {tool: tc.name, input: tc.arguments, output, durationMs};

                    this.logger.debug(`Tool "${tc.name}" executed in ${durationMs}ms`);

                    return {
                        toolCallId: tc.id,
                        toolName: tc.name,
                        output: typeof output === 'string' ? output : JSON.stringify(output),
                        record,
                    };
                } catch (error) {
                    const durationMs = Date.now() - start;
                    const errorMessage = error instanceof Error ? error.message : String(error);

                    this.logger.error(`Tool "${tc.name}" failed: ${errorMessage}`);
                    const record: AgentToolCallRecord = {
                        tool: tc.name,
                        input: tc.arguments,
                        output: null,
                        durationMs,
                        error: errorMessage,
                    };

                    return {
                        toolCallId: tc.id,
                        toolName: tc.name,
                        output: JSON.stringify({error: errorMessage}),
                        record,
                    };
                }
            })
        );
    }
}
