import {Injectable} from '@nestjs/common';
import {z} from 'zod';
import type {AgentTool} from '../../interfaces';
import {AGENT_TOOL_TOKEN} from '../../interfaces';
import type {ToolContext} from '../../interfaces';
import {PatientRepository} from '../../../../domain/patient/patient.repository';
import {PatientId} from '../../../../domain/patient/entities';
import type {PatientView} from '../../mappers/patient-view.mapper';
import {toPatientView} from '../../mappers/patient-view.mapper';

const schema = z.object({
    patientId: z.string().uuid().describe('UUID of the patient.'),
});

type Input = z.infer<typeof schema>;
type Output = {patient: PatientView | null};

@Injectable()
export class GetPatientTool implements AgentTool<Input, Output> {
    readonly name = 'get_patient';
    readonly description = 'Retrieve a patient by their ID.';
    readonly domain = 'patient' as const;
    readonly inputSchema = schema;

    constructor(private readonly patientRepository: PatientRepository) {}

    async execute(input: Input, context: ToolContext): Promise<Output> {
        const patient = await this.patientRepository.findById(
            PatientId.from(input.patientId),
            context.clinicId,
        );
        return {patient: patient ? toPatientView(patient) : null};
    }
}

export const GetPatientToolProvider = {
    provide: AGENT_TOOL_TOKEN,
    useClass: GetPatientTool,
};
