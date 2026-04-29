import { Injectable } from "@nestjs/common";
import { z } from "zod";
import type { AgentTool, ToolContext } from "@application/agent/interfaces";
import { AGENT_TOOL_TOKEN } from "@application/agent/interfaces";
import { RetrieveKnowledgeChunksService } from "@application/knowledge-base/services/retrieve-knowledge-chunks.service";
import { AiSpecialtyGroup } from "@domain/form-template/entities";

const schema = z.object({
  query: z
    .string()
    .min(1)
    .max(1000)
    .describe("Natural language query to search the knowledge base."),
  topK: z.coerce.number().int().min(1).max(10).optional().default(5),
  specialty: z
    .nativeEnum(AiSpecialtyGroup)
    .optional()
    .describe("Filter results by medical specialty group."),
  category: z
    .string()
    .optional()
    .describe('Filter results by category (e.g. "protocolo", "conduta").'),
  minScore: z.coerce.number().min(0).max(1).optional().default(0.3),
});

type Input = z.infer<typeof schema>;
type Output = {
  chunks: Array<{ content: string; category: string; specialty: string | null; score: number }>;
  total: number;
};

@Injectable()
export class SearchKnowledgeTool implements AgentTool<Input, Output> {
  readonly name = "search_knowledge";
  readonly description =
    "Search the clinical knowledge base (protocols, guidelines, conducts) using semantic similarity. Returns relevant chunks ranked by relevance score.";
  readonly domain = "knowledge" as const;
  readonly inputSchema = schema;

  constructor(private readonly retrieveService: RetrieveKnowledgeChunksService) {}

  async execute(input: Input, context: ToolContext): Promise<Output> {
    const result = await this.retrieveService.execute({
      query: input.query,
      topK: input.topK ?? 5,
      specialty: input.specialty,
      category: input.category,
      clinicId: context.clinicId ?? null,
      minScore: input.minScore ?? 0.3,
    });

    return {
      chunks: result.chunks.map((c) => ({
        content: c.content,
        category: c.category,
        specialty: c.specialty,
        score: c.score,
      })),
      total: result.totalChunks,
    };
  }
}

export const SearchKnowledgeToolProvider = {
  provide: AGENT_TOOL_TOKEN,
  useClass: SearchKnowledgeTool,
};
