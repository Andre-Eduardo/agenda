import type {ClinicMemberId} from '@domain/clinic-member/entities';
import type {ClinicId} from '@domain/clinic/entities';
import type {ProfessionalAgendaAccess, ProfessionalAgendaAccessId} from '@domain/professional-agenda-access/entities';

export interface ProfessionalAgendaAccessRepository {
    findById(id: ProfessionalAgendaAccessId): Promise<ProfessionalAgendaAccess | null>;
    findByGranteeAndProfessional(
        granteeMemberId: ClinicMemberId,
        professionalMemberId: ClinicMemberId
    ): Promise<ProfessionalAgendaAccess | null>;
    findByProfessionalId(clinicId: ClinicId, professionalMemberId: ClinicMemberId): Promise<ProfessionalAgendaAccess[]>;
    findByGranteeId(clinicId: ClinicId, granteeMemberId: ClinicMemberId): Promise<ProfessionalAgendaAccess[]>;
    save(access: ProfessionalAgendaAccess): Promise<void>;
}

export abstract class ProfessionalAgendaAccessRepository {}
