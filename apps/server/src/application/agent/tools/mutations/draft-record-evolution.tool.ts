import {Injectable} from '@nestjs/common';
import {z} from 'zod';
import type {AgentTool, ToolContext} from '../../interfaces';
import {AGENT_TOOL_TOKEN} from '../../interfaces';
import {RecordRepository} from '../../../../domain/record/record.repository';
import {Record, RecordSource} from '../../../../domain/record/entities';
import {PatientId} from '../../../../domain/patient/entities';
import {ProfessionalId} from '../../../../domain/professional/entities';
import {EventDispatcher} from '../../../../domain/event';

const schema = z.object({
    patientId: z.string().uuid().describe('UUID of the patient this evolution is for.'),
    subjective: z.string().max(4000).optional().describe('Subjective section (patient complaints, history).'),
    objective: z.string().max(4000).optional().describe('Objective section (exam findings, measurements).'),
    assessment: z.string().max(4000).optional().describe('Assessment/diagnosis section.'),
    plan: z.string().max(4000).optional().describe('Plan/treatment section.'),
    freeNotes: z.string().max(4000).optional().describe('Free-form clinical notes.'),
    title: z.string().max(255).optional().describe('Title for this evolution.'),
});

type Input = z.infer<typeof schema>;
type Output = {
    recordId: string;
    requiresReview: true;
    summary: string;
};

@Injectable()
export class DraftRecordEvolutionTool implements AgentTool<Input, Output> {
    readonly name = 'draft_record_evolution';
    readonly description =
        'Creates a DRAFT clinical evolution (SOAP) that requires review before becoming official. ' +
        'Use when asked to write, register, or document a clinical evolution or consultation record. ' +
        'Returns a draft record that the professional must review and approve — never creates a final record directly.';
    readonly domain = 'mutation' as const;
    readonly destructive = true;
    readonly inputSchema = schema;

    constructor(
        private readonly recordRepository: RecordRepository,
        private readonly eventDispatcher: EventDispatcher,
    ) {}

    async execute(input: Input, context: ToolContext): Promise<Output> {
        const professionalId = context.professionalId ?? ProfessionalId.from(context.actor.userId.toString());

        const record = Record.create({
            patientId: PatientId.from(input.patientId),
            professionalId,
            title: input.title ?? 'AI-assisted evolution (draft)',
            subjective: input.subjective ?? null,
            objective: input.objective ?? null,
            assessment: input.assessment ?? null,
            plan: input.plan ?? null,
            freeNotes: input.freeNotes ?? null,
            conductTags: [],
            files: [],
            source: RecordSource.IMPORT,
            wasHumanEdited: false,
        });

        await this.recordRepository.save(record);
        this.eventDispatcher.dispatch(context.actor, record);

        return {
            recordId: record.id.toString(),
            requiresReview: true,
            summary: 'Draft evolution created — please review and approve before it becomes official.',
        };
    }
}

export const DraftRecordEvolutionToolProvider = {
    provide: AGENT_TOOL_TOKEN,
    useClass: DraftRecordEvolutionTool,
};
