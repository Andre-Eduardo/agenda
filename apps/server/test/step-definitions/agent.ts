import {Given} from '@cucumber/cucumber';
import {randomUUID} from 'crypto';
import type {Context} from '../support/context';

/**
 * Seeds a PENDING AgentProposal of the given type directly in the database.
 * The proposal ID is stored as `${ref:id:agentProposal:<key>}`.
 *
 * Supported types: PATIENT_ALERT, APPOINTMENT, APPOINTMENT_CANCEL, APPOINTMENT_RESCHEDULE
 *
 * Example:
 *   Given a pending agent proposal of type "PATIENT_ALERT" exists as "proposal1"
 */
Given(
    'a pending agent proposal of type {string} exists as {string}',
    async function (this: Context, proposalType: string, key: string) {
        const clinicId = this.getVariableId('clinic', 'dr_house');
        const memberId = this.getVariableId('clinicMember', 'dr_house');

        const patientId = (() => {
            try {
                return this.getVariableId('patient', 'proposal_patient');
            } catch {
                return null;
            }
        })();

        const now = new Date();
        const proposalId = randomUUID();

        // Build a minimal valid payload depending on the proposal type
        const payload =
            proposalType === 'PATIENT_ALERT'
                ? {message: 'Paciente com risco elevado de hipoglicemia', severity: 'HIGH'}
                : proposalType === 'APPOINTMENT'
                  ? {
                        patientId,
                        attendedByMemberId: memberId,
                        startAt: '2026-08-01T09:00:00.000Z',
                        endAt: '2026-08-01T10:00:00.000Z',
                        type: 'FIRST_VISIT',
                    }
                  : {};

        const preview = {
            title: `Proposta: ${proposalType}`,
            description: 'Gerada automaticamente em teste',
        };

        await this.prisma.agentProposal.create({
            data: {
                id: proposalId,
                clinicId,
                createdByMemberId: memberId,
                patientId,
                proposalType: proposalType as any,
                status: 'PENDING',
                payload,
                preview,
                rationale: 'Proposta criada em teste BDD',
                confidence: 0.95,
                expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
                createdAt: now,
                updatedAt: now,
            },
        });

        this.setVariableId('agentProposal', key, proposalId);
    },
);
