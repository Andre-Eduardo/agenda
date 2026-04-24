import {Injectable} from '@nestjs/common';
import {z} from 'zod';
import type {AgentTool} from '../../interfaces';
import {AGENT_TOOL_TOKEN} from '../../interfaces';
import type {ToolContext} from '../../interfaces';
import {AppointmentRepository} from '../../../../domain/appointment/appointment.repository';
import {PatientId} from '../../../../domain/patient/entities';
import type {AppointmentView} from '../../mappers/appointment-view.mapper';
import {toAppointmentView} from '../../mappers/appointment-view.mapper';

const schema = z.object({
    patientId: z.string().uuid().describe('UUID of the patient.'),
    dateFrom: z.string().datetime().optional().describe('ISO8601 start date filter (inclusive).'),
    dateTo: z.string().datetime().optional().describe('ISO8601 end date filter (inclusive).'),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

type Input = z.infer<typeof schema>;
type Output = {appointments: AppointmentView[]; total: number};

@Injectable()
export class ListPatientAppointmentsTool implements AgentTool<Input, Output> {
    readonly name = 'list_patient_appointments';
    readonly description = 'List appointments for a specific patient, optionally filtered by date range.';
    readonly domain = 'agenda' as const;
    readonly inputSchema = schema;

    constructor(private readonly appointmentRepository: AppointmentRepository) {}

    async execute(input: Input, _context: ToolContext): Promise<Output> {
        const result = await this.appointmentRepository.search(
            {page: 1, limit: input.limit ?? 10, sort: [{key: 'startAt', direction: 'desc'}]},
            {
                patientId: PatientId.from(input.patientId),
                dateFrom: input.dateFrom ? new Date(input.dateFrom) : undefined,
                dateTo: input.dateTo ? new Date(input.dateTo) : undefined,
            }
        );

        return {
            appointments: result.data.map(toAppointmentView),
            total: result.totalCount,
        };
    }
}

export const ListPatientAppointmentsToolProvider = {
    provide: AGENT_TOOL_TOKEN,
    useClass: ListPatientAppointmentsTool,
};
