import {Injectable} from '@nestjs/common';
import {z} from 'zod';
import type {AgentTool} from '../../interfaces';
import {AGENT_TOOL_TOKEN} from '../../interfaces';
import type {ToolContext} from '../../interfaces';
import {PatientFormRepository} from '../../../../domain/patient-form/patient-form.repository';
import {PatientFormId} from '../../../../domain/patient-form/entities';

const schema = z.object({
    patientFormId: z.string().uuid().describe('UUID of the patient form response.'),
});

type Input = z.infer<typeof schema>;
type Output = {
    id: string;
    clinicId: string;
    patientId: string;
    createdByMemberId: string;
    responsibleProfessionalId: string | null;
    templateId: string;
    status: string;
    appliedAt: string;
    completedAt: string | null;
} | null;

@Injectable()
export class GetPatientFormTool implements AgentTool<Input, Output> {
    readonly name = 'get_patient_form';
    readonly description = 'Retrieve a specific patient form response by its ID.';
    readonly domain = 'form-data' as const;
    readonly inputSchema = schema;

    constructor(private readonly patientFormRepository: PatientFormRepository) {}

    async execute(input: Input, _context: ToolContext): Promise<Output> {
        const form = await this.patientFormRepository.findById(PatientFormId.from(input.patientFormId));
        if (!form) return null;
        return {
            id: form.id.toString(),
            clinicId: form.clinicId.toString(),
            patientId: form.patientId.toString(),
            createdByMemberId: form.createdByMemberId.toString(),
            responsibleProfessionalId: form.responsibleProfessionalId?.toString() ?? null,
            templateId: form.templateId.toString(),
            status: form.status,
            appliedAt: form.appliedAt.toISOString(),
            completedAt: form.completedAt?.toISOString() ?? null,
        };
    }
}

export const GetPatientFormToolProvider = {
    provide: AGENT_TOOL_TOKEN,
    useClass: GetPatientFormTool,
};
