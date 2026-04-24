import {Injectable} from '@nestjs/common';
import {z} from 'zod';
import type {AgentTool} from '../../interfaces';
import {AGENT_TOOL_TOKEN} from '../../interfaces';
import type {ToolContext} from '../../interfaces';
import {PatientId} from '../../../../domain/patient/entities';
import {GetContextSnapshotService} from '../../../clinical-chat/services/get-context-snapshot.service';

const schema = z.object({
    patientId: z.string().uuid().describe('UUID of the patient whose clinical profile is requested.'),
});

type Input = z.infer<typeof schema>;
type Output = {
    patientFacts: unknown;
    criticalContext: unknown;
    timelineSummary: unknown;
    isStale: boolean;
};

@Injectable()
export class GetPatientProfileTool implements AgentTool<Input, Output> {
    readonly name = 'get_patient_profile';
    readonly description =
        'Retrieve the clinical profile snapshot for a patient: demographics, chronic conditions, medications, allergies, and recent timeline.';
    readonly domain = 'patient' as const;
    readonly inputSchema = schema;

    constructor(private readonly getSnapshotService: GetContextSnapshotService) {}

    async execute(input: Input, context: ToolContext): Promise<Output> {
        const {snapshot, isStale} = await this.getSnapshotService.execute({
            patientId: PatientId.from(input.patientId),
            professionalId: context.professionalId ?? null,
            autoRebuildIfStale: false,
        });

        return {
            patientFacts: snapshot?.patientFacts ?? null,
            criticalContext: snapshot?.criticalContext ?? null,
            timelineSummary: snapshot?.timelineSummary ?? null,
            isStale,
        };
    }
}

export const GetPatientProfileToolProvider = {
    provide: AGENT_TOOL_TOKEN,
    useClass: GetPatientProfileTool,
};
