import { Injectable } from "@nestjs/common";
import { ClinicMemberId } from "@domain/clinic-member/entities";
import { PatientId } from "@domain/patient/entities";
import { ChatSessionStatus } from "@domain/clinical-chat/entities";
import { PatientChatSessionRepository } from "@domain/clinical-chat/patient-chat-session.repository";
import { PaginatedList, Pagination } from "@domain/@shared/repository";
import { ApplicationService, Command } from "@application/@shared/application.service";
import type { PatientChatSession } from "@domain/clinical-chat/entities";

export type ListChatSessionsInput = Pagination<["createdAt", "updatedAt", "lastActivityAt"]> & {
  patientId?: PatientId;
  memberId?: ClinicMemberId;
  status?: ChatSessionStatus;
};

@Injectable()
export class ListChatSessionsService implements ApplicationService<
  ListChatSessionsInput,
  PaginatedList<PatientChatSession>
> {
  constructor(private readonly sessionRepository: PatientChatSessionRepository) {}

  execute({
    actor,
    payload,
  }: Command<ListChatSessionsInput>): Promise<PaginatedList<PatientChatSession>> {
    const { patientId, memberId, status, ...pagination } = payload;

    return this.sessionRepository.search(pagination, {
      clinicId: actor.clinicId,
      patientId,
      memberId,
      status,
    });
  }
}
