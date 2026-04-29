import { Injectable } from "@nestjs/common";
import { z } from "zod";
import type { AgentTool, ToolContext } from "@application/agent/interfaces";
import { AGENT_TOOL_TOKEN } from "@application/agent/interfaces";
import { ProfessionalRepository } from "@domain/professional/professional.repository";
import { RecordRepository } from "@domain/record/record.repository";
import { Record, RecordSource } from "@domain/record/entities";
import { PatientId } from "@domain/patient/entities";
import { EventDispatcher } from "@domain/event";
import { PreconditionException } from "@domain/@shared/exceptions";

const schema = z.object({
  patientId: z.string().uuid().describe("UUID of the patient this evolution is for."),
  subjective: z
    .string()
    .max(4000)
    .optional()
    .describe("Subjective section (patient complaints, history)."),
  objective: z
    .string()
    .max(4000)
    .optional()
    .describe("Objective section (exam findings, measurements)."),
  assessment: z.string().max(4000).optional().describe("Assessment/diagnosis section."),
  plan: z.string().max(4000).optional().describe("Plan/treatment section."),
  freeNotes: z.string().max(4000).optional().describe("Free-form clinical notes."),
  title: z.string().max(255).optional().describe("Title for this evolution."),
});

type Input = z.infer<typeof schema>;
type Output = {
  recordId: string;
  requiresReview: true;
  summary: string;
};

@Injectable()
export class DraftRecordEvolutionTool implements AgentTool<Input, Output> {
  readonly name = "draft_record_evolution";
  readonly description =
    "Creates a DRAFT clinical evolution (SOAP) that requires review before becoming official. " +
    "Use when asked to write, register, or document a clinical evolution or consultation record. " +
    "Returns a draft record that the professional must review and approve — never creates a final record directly.";
  readonly domain = "mutation" as const;
  readonly destructive = true;
  readonly inputSchema = schema;

  constructor(
    private readonly recordRepository: RecordRepository,
    private readonly professionalRepository: ProfessionalRepository,
    private readonly eventDispatcher: EventDispatcher,
  ) {}

  async execute(input: Input, context: ToolContext): Promise<Output> {
    const memberId = context.memberId ?? context.actor.clinicMemberId;
    const clinicId = context.clinicId ?? context.actor.clinicId;

    // The Record's responsibleProfessional is derived from the chat member.
    // If the member doesn't have a Professional 1:1 (e.g. SECRETARY chatting),
    // we can't draft a clinical record on their behalf — fail loudly.
    const professional = await this.professionalRepository.findByClinicMemberId(memberId);

    if (professional === null) {
      throw new PreconditionException(
        "Cannot draft a clinical record on behalf of a non-PROFESSIONAL member.",
      );
    }

    const record = Record.create({
      clinicId,
      patientId: PatientId.from(input.patientId),
      createdByMemberId: memberId,
      responsibleProfessionalId: professional.id,
      title: input.title ?? "AI-assisted evolution (draft)",
      subjective: input.subjective ?? null,
      objective: input.objective ?? null,
      assessment: input.assessment ?? null,
      plan: input.plan ?? null,
      freeNotes: input.freeNotes ?? null,
      conductTags: [],
      files: [],
      source: RecordSource.IMPORT,
      wasHumanEdited: false,
      isLocked: false,
    });

    await this.recordRepository.save(record);
    this.eventDispatcher.dispatch(context.actor, record);

    return {
      recordId: record.id.toString(),
      requiresReview: true,
      summary: "Draft evolution created — please review and approve before it becomes official.",
    };
  }
}

export const DraftRecordEvolutionToolProvider = {
  provide: AGENT_TOOL_TOKEN,
  useClass: DraftRecordEvolutionTool,
};
