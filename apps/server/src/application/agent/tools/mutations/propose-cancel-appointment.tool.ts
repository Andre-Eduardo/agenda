import { Injectable } from "@nestjs/common";
import { z } from "zod";
import type { AgentTool, ToolContext } from "@application/agent/interfaces";
import { AGENT_TOOL_TOKEN } from "@application/agent/interfaces";
import {
  CreateAppointmentCancelProposalService,
  type AppointmentCancelProposalResult,
} from "@application/agent-proposal/services/create-appointment-cancel-proposal.service";

const schema = z.object({
  appointmentId: z.string().uuid().describe("UUID of the appointment to cancel."),
  reason: z.string().min(3).max(500).optional().describe("Reason for cancellation."),
});

type Input = z.infer<typeof schema>;

@Injectable()
export class ProposeCancelAppointmentTool implements AgentTool<
  Input,
  AppointmentCancelProposalResult
> {
  readonly name = "propose_cancel_appointment";
  readonly description =
    "Creates a PROPOSAL to cancel an appointment that the professional must confirm. " +
    "Use when asked to cancel, remove, or delete a scheduled appointment. " +
    "NEVER cancels the appointment directly — always requires human confirmation.";
  readonly domain = "mutation" as const;
  readonly destructive = true;
  readonly inputSchema = schema;

  constructor(private readonly createProposalService: CreateAppointmentCancelProposalService) {}

  execute(input: Input, context: ToolContext): Promise<AppointmentCancelProposalResult> {
    return this.createProposalService.execute({
      actor: context.actor,
      payload: {
        appointmentId: input.appointmentId,
        reason: input.reason,
        sessionId: context.sessionId?.toString(),
        messageId: context.messageId,
      },
    });
  }
}

export const ProposeCancelAppointmentToolProvider = {
  provide: AGENT_TOOL_TOKEN,
  useClass: ProposeCancelAppointmentTool,
};
