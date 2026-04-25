import {Injectable} from '@nestjs/common';
import {z} from 'zod';
import type {AgentTool} from '../../interfaces';
import {AGENT_TOOL_TOKEN} from '../../interfaces';
import type {ToolContext} from '../../interfaces';
import {RecordRepository} from '../../../../domain/record/record.repository';
import {PatientId} from '../../../../domain/patient/entities';
import type {RecordView} from '../../mappers/record-view.mapper';
import {toRecordView} from '../../mappers/record-view.mapper';

const schema = z.object({
    patientId: z.string().uuid().describe('UUID of the patient.'),
    dateStart: z.string().datetime().optional().describe('ISO8601 start date filter.'),
    dateEnd: z.string().datetime().optional().describe('ISO8601 end date filter.'),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

type Input = z.infer<typeof schema>;
type Output = {records: RecordView[]; total: number};

@Injectable()
export class ListPatientRecordsTool implements AgentTool<Input, Output> {
    readonly name = 'list_patient_records';
    readonly description = 'List clinical records (evolutions) for a specific patient, ordered by date descending.';
    readonly domain = 'record' as const;
    readonly inputSchema = schema;

    constructor(private readonly recordRepository: RecordRepository) {}

    async execute(input: Input, context: ToolContext): Promise<Output> {
        const result = await this.recordRepository.search(
            {page: 1, limit: input.limit ?? 10, sort: [{key: 'eventDate', direction: 'desc'}]},
            {
                patientId: PatientId.from(input.patientId),
                clinicId: context.clinicId,
                dateStart: input.dateStart ? new Date(input.dateStart) : undefined,
                dateEnd: input.dateEnd ? new Date(input.dateEnd) : undefined,
            }
        );
        return {records: result.data.map(toRecordView), total: result.totalCount};
    }
}

export const ListPatientRecordsToolProvider = {
    provide: AGENT_TOOL_TOKEN,
    useClass: ListPatientRecordsTool,
};
