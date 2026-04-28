import {Injectable} from '@nestjs/common';
import {AgentProposalRepository} from '../../../domain/agent-proposal/agent-proposal.repository';
import {AgentProposalId, AgentProposalType} from '../../../domain/agent-proposal/entities';
import {Appointment, AppointmentId, AppointmentType} from '../../../domain/appointment/entities';
import {AppointmentRepository} from '../../../domain/appointment/appointment.repository';
import {ClinicMemberId} from '../../../domain/clinic-member/entities';
import {EventDispatcher} from '../../../domain/event';
import {PatientAlert, AlertSeverity} from '../../../domain/patient-alert/entities';
import {PatientAlertRepository} from '../../../domain/patient-alert/patient-alert.repository';
import {PatientId} from '../../../domain/patient/entities';
import {PatientRepository} from '../../../domain/patient/patient.repository';
import {PreconditionException, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {toEnum} from '../../../domain/@shared/utils';
import type {Command} from '../../@shared/application.service';

export type ConfirmProposalInput = {proposalId: string};
export type ConfirmProposalResult = {proposalId: string; resultEntityId: string | null; type: string};

@Injectable()
export class ConfirmProposalService {
    constructor(
        private readonly proposalRepository: AgentProposalRepository,
        private readonly appointmentRepository: AppointmentRepository,
        private readonly patientRepository: PatientRepository,
        private readonly patientAlertRepository: PatientAlertRepository,
        private readonly eventDispatcher: EventDispatcher,
    ) {}

    async execute({actor, payload}: Command<ConfirmProposalInput>): Promise<ConfirmProposalResult> {
        const proposal = await this.proposalRepository.findById(AgentProposalId.from(payload.proposalId));

        if (!proposal) {
            throw new ResourceNotFoundException('Proposal not found.', payload.proposalId);
        }

        // Authorization: the actor's clinic must match the proposal's clinic.
        // The original author (createdByMemberId) does NOT need to be the
        // confirmer — that's the whole point of human-in-the-loop: any member
        // with permission in the same clinic can review and confirm.
        if (!proposal.clinicId.equals(actor.clinicId)) {
            throw new PreconditionException('You are not authorized to confirm this proposal.');
        }

        if (!proposal.isConfirmable()) {
            throw new PreconditionException(`Proposal cannot be confirmed (status: ${proposal.status}).`);
        }

        let resultEntityId: string | null = null;

        if (proposal.type === AgentProposalType.APPOINTMENT) {
            const p = proposal.payload;
            const patientId = PatientId.from(p.patientId as string);
            // Member that will attend — typically the same member that owned
            // the chat session that generated the proposal.
            const attendedByMemberId = ClinicMemberId.from(
                (p.attendedByMemberId as string | undefined) ?? proposal.createdByMemberId.toString(),
            );
            const startAt = new Date(p.startAt as string);
            const endAt = new Date(p.endAt as string);
            const durationMinutes = Math.round((endAt.getTime() - startAt.getTime()) / 60_000);

            const appointment = Appointment.create({
                clinicId: proposal.clinicId,
                patientId,
                attendedByMemberId,
                createdByMemberId: actor.clinicMemberId,
                startAt,
                endAt,
                durationMinutes,
                type: toEnum(AppointmentType, (p.type as string) ?? 'FOLLOW_UP'),
                note: (p.notes as string | undefined) ?? null,
            });

            await this.appointmentRepository.save(appointment);
            this.eventDispatcher.dispatch(actor, appointment);
            resultEntityId = appointment.id.toString();
        } else if (proposal.type === AgentProposalType.APPOINTMENT_CANCEL) {
            const p = proposal.payload;
            const appointment = await this.appointmentRepository.findById(
                AppointmentId.from(p.appointmentId as string),
            );

            if (!appointment) {
                throw new ResourceNotFoundException('Appointment not found.', p.appointmentId as string);
            }

            appointment.cancel((p.reason as string | undefined) ?? '');
            await this.appointmentRepository.save(appointment);
            this.eventDispatcher.dispatch(actor, appointment);
            resultEntityId = appointment.id.toString();
        } else if (proposal.type === AgentProposalType.PATIENT_ALERT) {
            const p = proposal.payload;
            const alert = PatientAlert.create({
                clinicId: proposal.clinicId,
                patientId: PatientId.from(p.patientId as string),
                createdByMemberId: actor.clinicMemberId,
                title: p.title as string,
                description: (p.description as string | undefined) ?? null,
                severity: toEnum(AlertSeverity, (p.severity as string) ?? 'MEDIUM'),
                isActive: true,
            });

            await this.patientAlertRepository.save(alert);
            this.eventDispatcher.dispatch(actor, alert);
            resultEntityId = alert.id.toString();
        }

        proposal.confirm(actor.clinicMemberId.toString(), resultEntityId ?? undefined);
        await this.proposalRepository.save(proposal);

        return {proposalId: proposal.id.toString(), resultEntityId, type: proposal.type};
    }
}
