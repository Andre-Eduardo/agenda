import {Injectable} from '@nestjs/common';
import {z} from 'zod';
import type {AgentTool} from '../../interfaces';
import {AGENT_TOOL_TOKEN} from '../../interfaces';
import type {ToolContext} from '../../interfaces';
import {AppointmentRepository} from '../../../../domain/appointment/appointment.repository';
import {AppointmentStatus} from '../../../../domain/appointment/entities';
import type {AppointmentView} from '../../mappers/appointment-view.mapper';
import {toAppointmentView} from '../../mappers/appointment-view.mapper';

const schema = z.object({
    dateFrom: z.string().datetime().optional().describe('ISO8601 start date (inclusive). Default: today.'),
    dateTo: z.string().datetime().optional().describe('ISO8601 end date (inclusive). Default: 7 days from dateFrom.'),
    status: z.array(z.nativeEnum(AppointmentStatus)).optional().describe('Filter by status values.'),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

type Input = z.infer<typeof schema>;
type Output = {appointments: AppointmentView[]; total: number};

@Injectable({})
export class ListAppointmentsTool implements AgentTool<Input, Output> {
    readonly name = 'list_appointments';
    readonly description =
        'List upcoming appointments for the current professional. Returns a paginated list filtered by date range and optional status.';
    readonly domain = 'agenda' as const;
    readonly inputSchema = schema;

    constructor(private readonly appointmentRepository: AppointmentRepository) {}

    async execute(input: Input, context: ToolContext): Promise<Output> {
        const now = new Date();
        const dateFrom = input.dateFrom ? new Date(input.dateFrom) : now;
        const dateTo = input.dateTo
            ? new Date(input.dateTo)
            : new Date(dateFrom.getTime() + 7 * 24 * 60 * 60 * 1000);

        const result = await this.appointmentRepository.search(
            {page: 1, limit: input.limit ?? 20, sort: [{key: 'startAt', direction: 'asc'}]},
            {
                clinicId: context.clinicId,
                dateFrom,
                dateTo,
                status: input.status,
            }
        );

        return {
            appointments: result.data.map(toAppointmentView),
            total: result.totalCount,
        };
    }
}

export const ListAppointmentsToolProvider = {
    provide: AGENT_TOOL_TOKEN,
    useClass: ListAppointmentsTool,
};
