import {Injectable} from '@nestjs/common';
import {z} from 'zod';
import type {AgentTool} from '../../interfaces';
import {AGENT_TOOL_TOKEN} from '../../interfaces';
import type {ToolContext} from '../../interfaces';
import {PatientRepository} from '../../../../domain/patient/patient.repository';
import type {PatientView} from '../../mappers/patient-view.mapper';
import {toPatientView} from '../../mappers/patient-view.mapper';

const schema = z.object({
    term: z.string().min(1).max(200).describe('Search term (name, email, phone, document ID).'),
    limit: z.coerce.number().int().min(1).max(20).optional().default(10),
});

type Input = z.infer<typeof schema>;
type Output = {patients: PatientView[]; total: number};

@Injectable()
export class SearchPatientsTool implements AgentTool<Input, Output> {
    readonly name = 'search_patients';
    readonly description = 'Search patients by name, email, phone, or document ID. Scoped to the current professional.';
    readonly domain = 'patient' as const;
    readonly inputSchema = schema;

    constructor(private readonly patientRepository: PatientRepository) {}

    async execute(input: Input, context: ToolContext): Promise<Output> {
        const result = await this.patientRepository.search(
            {page: 1, limit: input.limit ?? 10, sort: [{key: 'createdAt', direction: 'desc'}]},
            {term: input.term, clinicId: context.clinicId}
        );

        return {patients: result.data.map(toPatientView), total: result.totalCount};
    }
}

export const SearchPatientsToolProvider = {
    provide: AGENT_TOOL_TOKEN,
    useClass: SearchPatientsTool,
};
