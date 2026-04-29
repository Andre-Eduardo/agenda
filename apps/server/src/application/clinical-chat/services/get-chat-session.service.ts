import { Injectable } from "@nestjs/common";
import { ResourceNotFoundException } from "@domain/@shared/exceptions";
import { PatientChatSessionId } from "@domain/clinical-chat/entities";
import { PatientChatSessionRepository } from "@domain/clinical-chat/patient-chat-session.repository";
import { ApplicationService, Command } from "@application/@shared/application.service";
import type { PatientChatSession } from "@domain/clinical-chat/entities";

export type GetChatSessionInput = { sessionId: PatientChatSessionId };

@Injectable()
export class GetChatSessionService implements ApplicationService<
  GetChatSessionInput,
  PatientChatSession
> {
  constructor(private readonly sessionRepository: PatientChatSessionRepository) {}

  async execute({ payload }: Command<GetChatSessionInput>): Promise<PatientChatSession> {
    const session = await this.sessionRepository.findById(payload.sessionId);

    if (!session) {
      throw new ResourceNotFoundException("Chat session not found.", payload.sessionId.toString());
    }

    return session;
  }
}
