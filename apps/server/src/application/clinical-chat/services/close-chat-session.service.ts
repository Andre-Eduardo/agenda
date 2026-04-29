import { Injectable } from "@nestjs/common";
import { ResourceNotFoundException } from "@domain/@shared/exceptions";
import { PatientChatSessionId, ChatSessionStatus } from "@domain/clinical-chat/entities";
import { PatientChatSessionRepository } from "@domain/clinical-chat/patient-chat-session.repository";
import { ApplicationService, Command } from "@application/@shared/application.service";
import type { PatientChatSession } from "@domain/clinical-chat/entities";

export type CloseChatSessionInput = {
  sessionId: PatientChatSessionId;
  archive?: boolean;
};

@Injectable()
export class CloseChatSessionService implements ApplicationService<
  CloseChatSessionInput,
  PatientChatSession
> {
  constructor(private readonly sessionRepository: PatientChatSessionRepository) {}

  async execute({ payload }: Command<CloseChatSessionInput>): Promise<PatientChatSession> {
    const session = await this.sessionRepository.findById(payload.sessionId);

    if (!session) {
      throw new ResourceNotFoundException("Chat session not found.", payload.sessionId.toString());
    }

    if (session.status === ChatSessionStatus.ACTIVE) {
      if (payload.archive) {
        session.archive();
      } else {
        session.close();
      }

      await this.sessionRepository.save(session);
    }

    return session;
  }
}
