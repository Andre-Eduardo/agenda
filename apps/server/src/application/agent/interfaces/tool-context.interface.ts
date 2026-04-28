import type {Actor} from '@domain/@shared/actor';
import type {ClinicId} from '@domain/clinic/entities';
import type {ClinicMemberId} from '@domain/clinic-member/entities';
import type {PatientChatSessionId} from '@domain/clinical-chat/entities';
import type {PatientId} from '@domain/patient/entities';

export type ToolContext = {
    actor: Actor;
    /** Clinic boundary for the agent run; defaults to actor.clinicId. */
    clinicId?: ClinicId;
    /** Member that owns the chat session driving the agent. */
    memberId?: ClinicMemberId;
    patientId?: PatientId;
    sessionId?: PatientChatSessionId;
    messageId?: string;
};
