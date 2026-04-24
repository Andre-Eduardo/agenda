import {Injectable} from '@nestjs/common';
import {AgentProposal, AgentProposalType} from '../../../domain/agent-proposal/entities';
import {AgentProposalRepository} from '../../../domain/agent-proposal/agent-proposal.repository';
import {PatientRepository} from '../../../domain/patient/patient.repository';
import {PatientId} from '../../../domain/patient/entities';
import {ProfessionalId} from '../../../domain/professional/entities';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import type {Command} from '../../@shared/application.service';

export type CreatePatientAlertProposalInput = {
    patientId: string;
    professionalId: string;
    title: string;
    description?: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    sessionId?: string;
    messageId?: string;
};

export type PatientAlertProposalResult = {
    proposalId: string;
    requiresConfirmation: true;
    preview: Record<string, unknown>;
};

@Injectable()
export class CreatePatientAlertProposalService {
    constructor(
        private readonly proposalRepository: AgentProposalRepository,
        private readonly patientRepository: PatientRepository,
    ) {}

    async execute({payload}: Command<CreatePatientAlertProposalInput>): Promise<PatientAlertProposalResult> {
        const patientId = PatientId.from(payload.patientId);
        const professionalId = ProfessionalId.from(payload.professionalId);

        const patient = await this.patientRepository.findById(patientId);
        if (!patient) {
            throw new ResourceNotFoundException('Patient not found.', payload.patientId);
        }

        const preview: Record<string, unknown> = {
            patientId: payload.patientId,
            patientName: patient.name,
            title: payload.title,
            description: payload.description ?? null,
            severity: payload.severity,
        };

        const proposal = AgentProposal.create({
            professionalId,
            patientId: payload.patientId,
            sessionId: payload.sessionId ?? null,
            messageId: payload.messageId ?? null,
            type: AgentProposalType.PATIENT_ALERT,
            payload: {
                patientId: payload.patientId,
                professionalId: payload.professionalId,
                title: payload.title,
                description: payload.description,
                severity: payload.severity,
            },
            preview,
            rationale: payload.title,
            confidence: 0.85,
        });

        await this.proposalRepository.save(proposal);

        return {
            proposalId: proposal.id.toString(),
            requiresConfirmation: true,
            preview,
        };
    }
}
