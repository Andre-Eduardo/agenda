import { Injectable } from "@nestjs/common";
import { ResourceNotFoundException } from "@domain/@shared/exceptions";
import { PatientChatSessionId } from "@domain/clinical-chat/entities";
import { PatientChatSessionRepository } from "@domain/clinical-chat/patient-chat-session.repository";
import { PatientChatMessageRepository } from "@domain/clinical-chat/patient-chat-message.repository";
import { PaginatedList, Pagination } from "@domain/@shared/repository";
import { ApplicationService, Command } from "@application/@shared/application.service";
import type { PatientChatMessage } from "@domain/clinical-chat/entities";

export type ListChatMessagesInput = Pagination<["createdAt"]> & {
  sessionId: PatientChatSessionId;
};

@Injectable()
export class ListChatMessagesService implements ApplicationService<
  ListChatMessagesInput,
  PaginatedList<PatientChatMessage>
> {
  constructor(
    private readonly sessionRepository: PatientChatSessionRepository,
    private readonly messageRepository: PatientChatMessageRepository,
  ) {}

  async execute({
    payload,
  }: Command<ListChatMessagesInput>): Promise<PaginatedList<PatientChatMessage>> {
    const { sessionId, ...pagination } = payload;

    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new ResourceNotFoundException("Chat session not found.", sessionId.toString());
    }

    return this.messageRepository.listBySession(sessionId, pagination);
  }
}
