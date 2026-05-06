import {Injectable} from '@nestjs/common';
import type {Command} from '@application/@shared/application.service';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {AgentProposalRepository} from '@domain/agent-proposal/agent-proposal.repository';
import {AgentProposal, AgentProposalType} from '@domain/agent-proposal/entities';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {AppointmentId} from '@domain/appointment/entities';

export type CreateAppointmentRescheduleProposalInput = {
    appointmentId: string;
    newStartAt: Date;
    newEndAt: Date;
    reason?: string;
    sessionId?: string;
    messageId?: string;
};

export type AppointmentRescheduleProposalResult = {
    proposalId: string;
    requiresConfirmation: true;
    preview: Record<string, unknown>;
};

@Injectable()
export class CreateAppointmentRescheduleProposalService {
    constructor(
        private readonly proposalRepository: AgentProposalRepository,
        private readonly appointmentRepository: AppointmentRepository
    ) {}

    async execute({
        actor,
        payload,
    }: Command<CreateAppointmentRescheduleProposalInput>): Promise<AppointmentRescheduleProposalResult> {
        const appointment = await this.appointmentRepository.findById(AppointmentId.from(payload.appointmentId));

        if (!appointment) {
            throw new ResourceNotFoundException('Appointment not found.', payload.appointmentId);
        }

        const preview: Record<string, unknown> = {
            appointmentId: payload.appointmentId,
            patientId: appointment.patientId.toString(),
            oldStartAt: appointment.startAt.toISOString(),
            newStartAt: payload.newStartAt.toISOString(),
            newEndAt: payload.newEndAt.toISOString(),
            reason: payload.reason ?? null,
        };

        const proposal = AgentProposal.create({
            clinicId: actor.clinicId,
            createdByMemberId: actor.clinicMemberId,
            patientId: appointment.patientId.toString(),
            sessionId: payload.sessionId ?? null,
            messageId: payload.messageId ?? null,
            type: AgentProposalType.APPOINTMENT_RESCHEDULE,
            payload: {
                appointmentId: payload.appointmentId,
                newStartAt: payload.newStartAt.toISOString(),
                newEndAt: payload.newEndAt.toISOString(),
                reason: payload.reason,
            },
            preview,
            rationale: payload.reason ?? 'Reschedule requested',
            confidence: 0.9,
        });

        await this.proposalRepository.save(proposal);

        return {proposalId: proposal.id.toString(), requiresConfirmation: true, preview};
    }
}
