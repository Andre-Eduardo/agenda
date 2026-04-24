import {Injectable} from '@nestjs/common';
import {z} from 'zod';
import type {AgentTool, ToolContext} from '../../interfaces';
import {AGENT_TOOL_TOKEN} from '../../interfaces';
import {CreatePatientAlertProposalService, type PatientAlertProposalResult} from '../../../agent-proposal/services/create-patient-alert-proposal.service';

const schema = z.object({
    patientId: z.string().uuid().describe('UUID of the patient.'),
    title: z.string().min(3).max(255).describe('Short title for the alert (e.g. "Penicillin allergy").'),
    description: z.string().max(1000).optional().describe('Detailed description of the alert.'),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM').describe('Severity level of the alert.'),
});

type Input = z.infer<typeof schema>;

@Injectable()
export class ProposePatientAlertTool implements AgentTool<Input, PatientAlertProposalResult> {
    readonly name = 'propose_patient_alert';
    readonly description =
        'Creates a PROPOSAL to register a patient alert (allergy, contraindication, warning) that the professional must confirm. ' +
        'Use when the professional wants to flag a health risk or important clinical note. ' +
        'NEVER creates the alert directly — always requires human confirmation.';
    readonly domain = 'mutation' as const;
    readonly destructive = true;
    readonly inputSchema = schema;

    constructor(private readonly createProposalService: CreatePatientAlertProposalService) {}

    async execute(input: Input, context: ToolContext): Promise<PatientAlertProposalResult> {
        return this.createProposalService.execute({
            actor: context.actor,
            payload: {
                patientId: input.patientId,
                professionalId: context.professionalId?.toString() ?? context.actor.userId.toString(),
                title: input.title,
                description: input.description,
                severity: input.severity,
                sessionId: context.sessionId?.toString(),
                messageId: context.messageId,
            },
        });
    }
}

export const ProposePatientAlertToolProvider = {
    provide: AGENT_TOOL_TOKEN,
    useClass: ProposePatientAlertTool,
};
