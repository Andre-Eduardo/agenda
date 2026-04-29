import { Injectable } from "@nestjs/common";
import { z } from "zod";
import type { AgentTool, ToolContext } from "@application/agent/interfaces";
import { AGENT_TOOL_TOKEN } from "@application/agent/interfaces";
import { RecordRepository } from "@domain/record/record.repository";
import { RecordId } from "@domain/record/entities";
import type { RecordView } from "@application/agent/mappers/record-view.mapper";
import { toRecordView } from "@application/agent/mappers/record-view.mapper";

const schema = z.object({
  recordId: z.string().uuid().describe("UUID of the clinical record."),
});

type Input = z.infer<typeof schema>;
type Output = { record: RecordView | null };

@Injectable()
export class GetRecordTool implements AgentTool<Input, Output> {
  readonly name = "get_record";
  readonly description = "Retrieve a single clinical record by its ID.";
  readonly domain = "record" as const;
  readonly inputSchema = schema;

  constructor(private readonly recordRepository: RecordRepository) {}

  async execute(input: Input, _context: ToolContext): Promise<Output> {
    const record = await this.recordRepository.findById(RecordId.from(input.recordId));

    return { record: record ? toRecordView(record) : null };
  }
}

export const GetRecordToolProvider = {
  provide: AGENT_TOOL_TOKEN,
  useClass: GetRecordTool,
};
