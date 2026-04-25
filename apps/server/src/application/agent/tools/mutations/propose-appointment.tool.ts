import {Injectable} from '@nestjs/common';
import {z} from 'zod';
import type {AgentTool, ToolContext} from '../../interfaces';
import {AGENT_TOOL_TOKEN} from '../../interfaces';
import {CreateAppointmentProposalService, type AppointmentProposalResult} from '../../../agent-proposal/services/create-appointment-proposal.service';

const schema = z.object({
    patientId: z.string().uuid().describe('UUID of the patient to schedule.'),
    startAt: z.string().datetime().describe('ISO8601 start datetime for the appointment.'),
    endAt: z.string().datetime().describe('ISO8601 end datetime for the appointment.'),
    type: z.enum(['FIRST_VISIT', 'FOLLOW_UP', 'EVALUATION', 'PROCEDURE', 'TELEMEDICINE', 'INTERCURRENCE']).optional(),
    reason: z.string().min(3).max(500).describe('Reason or purpose for the appointment.'),
    notes: z.string().max(1000).optional().describe('Additional notes.'),
});

type Input = z.infer<typeof schema>;

@Injectable()
export class ProposeAppointmentTool implements AgentTool<Input, AppointmentProposalResult> {
    readonly name = 'propose_appointment';
    readonly description =
        'Creates a PROPOSAL to schedule an appointment that the professional must confirm before it is created. ' +
        'Use when asked to schedule, book, or arrange a consultation. ' +
        'NEVER creates the appointment directly — always requires human confirmation.';
    readonly domain = 'mutation' as const;
    readonly destructive = true;
    readonly inputSchema = schema;

    constructor(private readonly createProposalService: CreateAppointmentProposalService) {}

    async execute(input: Input, context: ToolContext): Promise<AppointmentProposalResult> {
        // Member that will attend defaults to the chat session's owning member.
        const attendedByMemberId = (context.memberId ?? context.actor.clinicMemberId).toString();
        return this.createProposalService.execute({
            actor: context.actor,
            payload: {
                patientId: input.patientId,
                attendedByMemberId,
                startAt: new Date(input.startAt),
                endAt: new Date(input.endAt),
                type: input.type,
                reason: input.reason,
                notes: input.notes,
                sessionId: context.sessionId?.toString(),
                messageId: context.messageId,
            },
        });
    }
}

export const ProposeAppointmentToolProvider = {
    provide: AGENT_TOOL_TOKEN,
    useClass: ProposeAppointmentTool,
};
