import type {Actor} from '../../../domain/@shared/actor';
import type {ProfessionalId} from '../../../domain/professional/entities';
import type {PatientId} from '../../../domain/patient/entities';
import type {PatientChatSessionId} from '../../../domain/clinical-chat/entities';

export type ToolContext = {
    actor: Actor;
    professionalId?: ProfessionalId;
    patientId?: PatientId;
    sessionId?: PatientChatSessionId;
    messageId?: string;
    companyId?: string;
};
