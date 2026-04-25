import {Injectable} from '@nestjs/common';
import {AgentProposal, AgentProposalType} from '../../../domain/agent-proposal/entities';
import {AgentProposalRepository} from '../../../domain/agent-proposal/agent-proposal.repository';
import {AppointmentRepository} from '../../../domain/appointment/appointment.repository';
import {AppointmentId} from '../../../domain/appointment/entities';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import type {Command} from '../../@shared/application.service';

export type CreateAppointmentCancelProposalInput = {
    appointmentId: string;
    reason?: string;
    sessionId?: string;
    messageId?: string;
};

export type AppointmentCancelProposalResult = {
    proposalId: string;
    requiresConfirmation: true;
    preview: Record<string, unknown>;
};

@Injectable()
export class CreateAppointmentCancelProposalService {
    constructor(
        private readonly proposalRepository: AgentProposalRepository,
        private readonly appointmentRepository: AppointmentRepository,
    ) {}

    async execute({actor, payload}: Command<CreateAppointmentCancelProposalInput>): Promise<AppointmentCancelProposalResult> {
        const appointment = await this.appointmentRepository.findById(AppointmentId.from(payload.appointmentId));
        if (!appointment) {
            throw new ResourceNotFoundException('Appointment not found.', payload.appointmentId);
        }

        const preview: Record<string, unknown> = {
            appointmentId: payload.appointmentId,
            patientId: appointment.patientId.toString(),
            startAt: appointment.startAt.toISOString(),
            reason: payload.reason ?? null,
        };

        const proposal = AgentProposal.create({
            clinicId: actor.clinicId,
            createdByMemberId: actor.clinicMemberId,
            patientId: appointment.patientId.toString(),
            sessionId: payload.sessionId ?? null,
            messageId: payload.messageId ?? null,
            type: AgentProposalType.APPOINTMENT_CANCEL,
            payload: {
                appointmentId: payload.appointmentId,
                reason: payload.reason,
            },
            preview,
            rationale: payload.reason ?? 'Cancellation requested',
            confidence: 0.95,
        });

        await this.proposalRepository.save(proposal);

        return {proposalId: proposal.id.toString(), requiresConfirmation: true, preview};
    }
}
