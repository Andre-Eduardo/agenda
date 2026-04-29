import { Injectable } from "@nestjs/common";
import { z } from "zod";
import type { AgentTool, ToolContext } from "@application/agent/interfaces";
import { AGENT_TOOL_TOKEN } from "@application/agent/interfaces";
import { PatientFormRepository } from "@domain/patient-form/patient-form.repository";
import { FormResponseStatus } from "@domain/patient-form/entities";
import { PatientId } from "@domain/patient/entities";

const schema = z.object({
  patientId: z.string().uuid().describe("UUID of the patient."),
  status: z.nativeEnum(FormResponseStatus).optional().describe("Filter by form status."),
  limit: z.coerce.number().int().min(1).max(20).optional().default(10),
});

type Input = z.infer<typeof schema>;
type FormEntry = {
  id: string;
  templateId: string;
  status: string;
  appliedAt: string;
  completedAt: string | null;
};
type Output = { forms: FormEntry[]; total: number };

@Injectable()
export class ListPatientFormsTool implements AgentTool<Input, Output> {
  readonly name = "list_patient_forms";
  readonly description =
    "List form responses for a specific patient, optionally filtered by status.";
  readonly domain = "form-data" as const;
  readonly inputSchema = schema;

  constructor(private readonly patientFormRepository: PatientFormRepository) {}

  async execute(input: Input, _context: ToolContext): Promise<Output> {
    const result = await this.patientFormRepository.search(
      { page: 1, limit: input.limit ?? 10, sort: [{ key: "appliedAt", direction: "desc" }] },
      { patientId: PatientId.from(input.patientId), status: input.status },
    );

    return {
      forms: result.data.map((f) => ({
        id: f.id.toString(),
        templateId: f.templateId.toString(),
        status: f.status,
        appliedAt: f.appliedAt.toISOString(),
        completedAt: f.completedAt?.toISOString() ?? null,
      })),
      total: result.totalCount,
    };
  }
}

export const ListPatientFormsToolProvider = {
  provide: AGENT_TOOL_TOKEN,
  useClass: ListPatientFormsTool,
};
