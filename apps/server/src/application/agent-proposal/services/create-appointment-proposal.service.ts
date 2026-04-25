import {Injectable} from '@nestjs/common';
import {AgentProposal, AgentProposalType} from '../../../domain/agent-proposal/entities';
import {AgentProposalRepository} from '../../../domain/agent-proposal/agent-proposal.repository';
import {AppointmentRepository} from '../../../domain/appointment/appointment.repository';
import {PatientRepository} from '../../../domain/patient/patient.repository';
import {PatientId} from '../../../domain/patient/entities';
import {ProfessionalId} from '../../../domain/professional/entities';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import type {Command} from '../../@shared/application.service';
import type {Actor} from '../../../domain/@shared/actor';

export type CreateAppointmentProposalInput = {
    patientId: string;
    professionalId: string;
    startAt: Date;
    endAt: Date;
    type?: string;
    reason: string;
    notes?: string;
    sessionId?: string;
    messageId?: string;
};

export type AppointmentProposalResult = {
    proposalId: string;
    requiresConfirmation: true;
    preview: Record<string, unknown>;
    hasConflict: boolean;
};

@Injectable()
export class CreateAppointmentProposalService {
    constructor(
        private readonly proposalRepository: AgentProposalRepository,
        private readonly appointmentRepository: AppointmentRepository,
        private readonly patientRepository: PatientRepository,
    ) {}

    async execute({payload}: Command<CreateAppointmentProposalInput>): Promise<AppointmentProposalResult> {
        const patientId = PatientId.from(payload.patientId);
        const professionalId = ProfessionalId.from(payload.professionalId);

        const patient = await this.patientRepository.findById(patientId);
        if (!patient) {
            throw new ResourceNotFoundException('Patient not found.', payload.patientId);
        }

        const conflicts = await this.appointmentRepository.findConflicts(professionalId, payload.startAt, payload.endAt);
        const hasConflict = conflicts.length > 0;

        const preview: Record<string, unknown> = {
            patientId: payload.patientId,
            patientName: patient.name,
            startAt: payload.startAt.toISOString(),
            endAt: payload.endAt.toISOString(),
            type: payload.type ?? 'FOLLOW_UP',
            reason: payload.reason,
            hasConflict,
        };

        const proposal = AgentProposal.create({
            professionalId,
            patientId: payload.patientId,
            sessionId: payload.sessionId ?? null,
            messageId: payload.messageId ?? null,
            type: AgentProposalType.APPOINTMENT,
            payload: {
                patientId: payload.patientId,
                professionalId: payload.professionalId,
                startAt: payload.startAt.toISOString(),
                endAt: payload.endAt.toISOString(),
                type: payload.type ?? 'FOLLOW_UP',
                reason: payload.reason,
                notes: payload.notes,
            },
            preview,
            rationale: payload.reason,
            confidence: hasConflict ? 0.5 : 0.9,
        });

        await this.proposalRepository.save(proposal);

        return {
            proposalId: proposal.id.toString(),
            requiresConfirmation: true,
            preview,
            hasConflict,
        };
    }
}
