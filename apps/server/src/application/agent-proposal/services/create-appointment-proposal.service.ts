import {Injectable} from '@nestjs/common';
import {AgentProposal, AgentProposalType} from '../../../domain/agent-proposal/entities';
import {AgentProposalRepository} from '../../../domain/agent-proposal/agent-proposal.repository';
import {AppointmentRepository} from '../../../domain/appointment/appointment.repository';
import {ClinicMemberId} from '../../../domain/clinic-member/entities';
import {PatientRepository} from '../../../domain/patient/patient.repository';
import {PatientId} from '../../../domain/patient/entities';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import type {Command} from '../../@shared/application.service';

export type CreateAppointmentProposalInput = {
    patientId: string;
    /** Member who will attend the appointment if confirmed. */
    attendedByMemberId: string;
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

    async execute({actor, payload}: Command<CreateAppointmentProposalInput>): Promise<AppointmentProposalResult> {
        const patientId = PatientId.from(payload.patientId);
        const attendedByMemberId = ClinicMemberId.from(payload.attendedByMemberId);

        const patient = await this.patientRepository.findById(patientId, actor.clinicId);
        if (!patient) {
            throw new ResourceNotFoundException('Patient not found.', payload.patientId);
        }

        const conflicts = await this.appointmentRepository.findConflicts(
            attendedByMemberId,
            payload.startAt,
            payload.endAt,
        );
        const hasConflict = conflicts.length > 0;

        const preview: Record<string, unknown> = {
            patientId: payload.patientId,
            patientName: patient.name,
            attendedByMemberId: payload.attendedByMemberId,
            startAt: payload.startAt.toISOString(),
            endAt: payload.endAt.toISOString(),
            type: payload.type ?? 'FOLLOW_UP',
            reason: payload.reason,
            hasConflict,
        };

        const proposal = AgentProposal.create({
            clinicId: actor.clinicId,
            createdByMemberId: actor.clinicMemberId,
            patientId: payload.patientId,
            sessionId: payload.sessionId ?? null,
            messageId: payload.messageId ?? null,
            type: AgentProposalType.APPOINTMENT,
            payload: {
                patientId: payload.patientId,
                attendedByMemberId: payload.attendedByMemberId,
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
