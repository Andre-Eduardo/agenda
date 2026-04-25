import {Injectable} from '@nestjs/common';
import {z} from 'zod';
import type {AgentTool} from '../../interfaces';
import {AGENT_TOOL_TOKEN} from '../../interfaces';
import type {ToolContext} from '../../interfaces';
import {AppointmentRepository} from '../../../../domain/appointment/appointment.repository';
import type {AppointmentView} from '../../mappers/appointment-view.mapper';
import {toAppointmentView} from '../../mappers/appointment-view.mapper';

const schema = z.object({
    startAt: z.string().datetime().describe('ISO8601 proposed start time.'),
    endAt: z.string().datetime().describe('ISO8601 proposed end time.'),
    excludeAppointmentId: z.string().uuid().optional().describe('Appointment ID to exclude from conflict check (useful when rescheduling).'),
});

type Input = z.infer<typeof schema>;
type Output = {hasConflict: boolean; conflicts: AppointmentView[]};

@Injectable()
export class CheckScheduleConflictsTool implements AgentTool<Input, Output> {
    readonly name = 'check_schedule_conflicts';
    readonly description =
        "Check whether a proposed time slot conflicts with the current professional's existing appointments.";
    readonly domain = 'agenda' as const;
    readonly inputSchema = schema;

    constructor(private readonly appointmentRepository: AppointmentRepository) {}

    async execute(input: Input, context: ToolContext): Promise<Output> {
        if (!context.professionalId) {
            return {hasConflict: false, conflicts: []};
        }

        const {AppointmentId} = await import('../../../../domain/appointment/entities');
        const excludeId = input.excludeAppointmentId
            ? AppointmentId.from(input.excludeAppointmentId)
            : undefined;

        const conflicts = await this.appointmentRepository.findConflicts(
            context.professionalId,
            new Date(input.startAt),
            new Date(input.endAt),
            excludeId,
        );

        return {
            hasConflict: conflicts.length > 0,
            conflicts: conflicts.map(toAppointmentView),
        };
    }
}

export const CheckScheduleConflictsToolProvider = {
    provide: AGENT_TOOL_TOKEN,
    useClass: CheckScheduleConflictsTool,
};
