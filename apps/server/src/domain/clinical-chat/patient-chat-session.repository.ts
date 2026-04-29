import { PaginatedList, Pagination } from "@domain/@shared/repository";
import type { ClinicId } from "@domain/clinic/entities";
import type { ClinicMemberId } from "@domain/clinic-member/entities";
import type { PatientId } from "@domain/patient/entities";
import type {
  PatientChatSession,
  PatientChatSessionId,
  ChatSessionStatus,
} from "@domain/clinical-chat/entities";

export type PatientChatSessionFilter = {
  clinicId?: ClinicId;
  patientId?: PatientId;
  memberId?: ClinicMemberId;
  status?: ChatSessionStatus;
};

export type PatientChatSessionSortOptions = ["createdAt", "updatedAt", "lastActivityAt"];

export interface PatientChatSessionRepository {
  findById(id: PatientChatSessionId): Promise<PatientChatSession | null>;

  search(
    pagination: Pagination<PatientChatSessionSortOptions>,
    filter?: PatientChatSessionFilter,
  ): Promise<PaginatedList<PatientChatSession>>;

  save(session: PatientChatSession): Promise<void>;

  delete(id: PatientChatSessionId): Promise<void>;
}

export abstract class PatientChatSessionRepository {}
