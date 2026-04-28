import {Injectable} from '@nestjs/common';
import {z} from 'zod';
import type {AgentTool} from '../../interfaces';
import {AGENT_TOOL_TOKEN} from '../../interfaces';
import type {ToolContext} from '../../interfaces';
import {AppointmentRepository} from '../../../../domain/appointment/appointment.repository';
import {AppointmentId} from '../../../../domain/appointment/entities';
import type {AppointmentView} from '../../mappers/appointment-view.mapper';
import {toAppointmentView} from '../../mappers/appointment-view.mapper';

const schema = z.object({
    appointmentId: z.string().uuid().describe('UUID of the appointment.'),
});

type Input = z.infer<typeof schema>;
type Output = {appointment: AppointmentView | null};

@Injectable()
export class GetAppointmentTool implements AgentTool<Input, Output> {
    readonly name = 'get_appointment';
    readonly description = 'Retrieve a single appointment by its ID.';
    readonly domain = 'agenda' as const;
    readonly inputSchema = schema;

    constructor(private readonly appointmentRepository: AppointmentRepository) {}

    async execute(input: Input, _context: ToolContext): Promise<Output> {
        const appointment = await this.appointmentRepository.findById(AppointmentId.from(input.appointmentId));

        return {appointment: appointment ? toAppointmentView(appointment) : null};
    }
}

export const GetAppointmentToolProvider = {
    provide: AGENT_TOOL_TOKEN,
    useClass: GetAppointmentTool,
};
