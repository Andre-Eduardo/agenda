import { Injectable } from "@nestjs/common";
import { ResourceNotFoundException, PreconditionException } from "@domain/@shared/exceptions";
import {
  PatientChatSessionId,
  PatientChatMessage,
  ChatMessageRole,
  ChatSessionStatus,
} from "@domain/clinical-chat/entities";
import { PatientChatSessionRepository } from "@domain/clinical-chat/patient-chat-session.repository";
import { PatientChatMessageRepository } from "@domain/clinical-chat/patient-chat-message.repository";
import { ApplicationService, Command } from "@application/@shared/application.service";

export type AddChatMessageInput = {
  sessionId: PatientChatSessionId;
  role: ChatMessageRole;
  content: string;
  metadata?: Record<string, unknown> | null;
  /**
   * IDs dos chunks usados como contexto para gerar esta mensagem.
   * Preenchido pela camada de resposta de IA (próxima etapa).
   */
  chunkIds?: string[];
};

/**
 * Adiciona uma mensagem a uma sessão de chat clínico.
 *
 * ESTADO ATUAL: Persiste a mensagem do usuário e retorna estrutura pronta.
 *
 * PONTO DE INTEGRAÇÃO FUTURA:
 * 1. Receber mensagem do usuário (role: USER)
 * 2. Chamar RetrievePatientChunksService para buscar contexto relevante
 * 3. Chamar provider LLM com contexto + mensagem → gerar resposta
 * 4. Persistir resposta como mensagem (role: ASSISTANT) com chunkIds rastreados
 * 5. Retornar a resposta gerada
 *
 * IMPORTANTE: Respostas geradas por IA NÃO são persistidas como records clínicos.
 */
@Injectable()
export class AddChatMessageService implements ApplicationService<
  AddChatMessageInput,
  PatientChatMessage
> {
  constructor(
    private readonly sessionRepository: PatientChatSessionRepository,
    private readonly messageRepository: PatientChatMessageRepository,
  ) {}

  async execute({ payload }: Command<AddChatMessageInput>): Promise<PatientChatMessage> {
    const session = await this.sessionRepository.findById(payload.sessionId);

    if (!session) {
      throw new ResourceNotFoundException("Chat session not found.", payload.sessionId.toString());
    }

    if (session.status !== ChatSessionStatus.ACTIVE) {
      throw new PreconditionException("Cannot add message to a non-active session.");
    }

    const message = PatientChatMessage.create({
      clinicId: session.clinicId,
      sessionId: payload.sessionId,
      role: payload.role,
      content: payload.content,
      metadata: payload.metadata ?? null,
      chunkIds: payload.chunkIds ?? [],
    });

    await this.messageRepository.save(message);

    // Atualizar timestamp de última atividade da sessão
    session.touch();
    await this.sessionRepository.save(session);

    return message;
  }
}
