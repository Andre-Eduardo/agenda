import type {z} from 'zod';
import type {ToolContext} from './tool-context.interface';

export interface AgentTool<TInput = unknown, TOutput = unknown> {
    readonly name: string;
    readonly description: string;
    readonly domain: 'agenda' | 'patient' | 'record' | 'form-data' | 'knowledge' | 'mutation';
    // z.ZodType<TInput, any, unknown> relaxes _input constraint to allow ZodDefault fields
    readonly inputSchema: z.ZodType<TInput, z.ZodTypeDef, unknown>;
    /** If true, the tool modifies data — requires explicit user confirmation. Default false. */
    readonly destructive?: boolean;
    execute(input: TInput, context: ToolContext): Promise<TOutput>;
}

export const AGENT_TOOL_TOKEN = Symbol('AgentTool');
