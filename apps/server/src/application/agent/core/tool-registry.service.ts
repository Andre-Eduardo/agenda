import {Inject, Injectable, Logger, Optional} from '@nestjs/common';
import type {AgentTool} from '../interfaces';
import {AGENT_TOOL_TOKEN} from '../interfaces';
import type {LLMToolDefinition} from '@domain/clinical-chat/ports';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {zodToJsonSchema} = require('zod-to-json-schema') as {zodToJsonSchema: (schema: unknown, opts?: unknown) => unknown};

@Injectable()
export class ToolRegistryService {
    private readonly logger = new Logger(ToolRegistryService.name);
    private readonly registry = new Map<string, AgentTool>();

    constructor(
        @Optional() @Inject(AGENT_TOOL_TOKEN)
        tools: AgentTool[] | AgentTool | null,
    ) {
        const toolArray: AgentTool[] = tools == null ? [] : (Array.isArray(tools) ? tools : [tools]);

        for (const tool of toolArray) {
            if (this.registry.has(tool.name)) {
                this.logger.warn(`Duplicate tool name: "${tool.name}" — overwriting previous registration.`);
            }

            this.registry.set(tool.name, tool);
            this.logger.debug(`Tool registered: ${tool.name} (domain: ${tool.domain})`);
        }
    }

    getAll(): AgentTool[] {
        return [...this.registry.values()];
    }

    getByName(name: string): AgentTool | undefined {
        return this.registry.get(name);
    }

    toLLMDefinitions(tools?: AgentTool[]): LLMToolDefinition[] {
        return (tools ?? this.getAll()).map((t) => ({
            name: t.name,
            description: t.description,
            parameters: zodToJsonSchema(t.inputSchema, {$refStrategy: 'none'}) as Record<string, unknown>,
        }));
    }

}
