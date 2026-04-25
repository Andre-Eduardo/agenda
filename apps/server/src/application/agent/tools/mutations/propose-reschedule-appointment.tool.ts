import {Injectable} from '@nestjs/common';
import {z} from 'zod';
import type {AgentTool, ToolContext} from '../../interfaces';
import {AGENT_TOOL_TOKEN} from '../../interfaces';
import {CreateAppointmentRescheduleProposalService, type AppointmentRescheduleProposalResult} from '../../../agent-proposal/services/create-appointment-reschedule-proposal.service';

const schema = z.object({
    appointmentId: z.string().uuid().describe('UUID of the appointment to reschedule.'),
    newStartAt: z.string().datetime().describe('ISO8601 new start datetime.'),
    newEndAt: z.string().datetime().describe('ISO8601 new end datetime.'),
    reason: z.string().min(3).max(500).optional().describe('Reason for rescheduling.'),
});

type Input = z.infer<typeof schema>;

@Injectable()
export class ProposeRescheduleAppointmentTool implements AgentTool<Input, AppointmentRescheduleProposalResult> {
    readonly name = 'propose_reschedule_appointment';
    readonly description =
        'Creates a PROPOSAL to reschedule an appointment to a new date/time that the professional must confirm. ' +
        'Use when asked to move, change, or reschedule an existing appointment. ' +
        'NEVER reschedules the appointment directly — always requires human confirmation.';
    readonly domain = 'mutation' as const;
    readonly destructive = true;
    readonly inputSchema = schema;

    constructor(private readonly createProposalService: CreateAppointmentRescheduleProposalService) {}

    async execute(input: Input, context: ToolContext): Promise<AppointmentRescheduleProposalResult> {
        return this.createProposalService.execute({
            actor: context.actor,
            payload: {
                appointmentId: input.appointmentId,
                professionalId: context.professionalId?.toString() ?? context.actor.userId.toString(),
                newStartAt: new Date(input.newStartAt),
                newEndAt: new Date(input.newEndAt),
                reason: input.reason,
                sessionId: context.sessionId?.toString(),
                messageId: context.messageId,
            },
        });
    }
}

export const ProposeRescheduleAppointmentToolProvider = {
    provide: AGENT_TOOL_TOKEN,
    useClass: ProposeRescheduleAppointmentTool,
};
