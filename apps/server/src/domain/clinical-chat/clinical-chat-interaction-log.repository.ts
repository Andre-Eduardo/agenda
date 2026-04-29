import type {
  ClinicalChatInteractionLog,
  ClinicalChatInteractionLogId,
  PatientChatSessionId,
} from "@domain/clinical-chat/entities";

export type InteractionMetrics = {
  totalInteractions: number;
  avgIterations: number | null;
  avgDurationMs: number | null;
  avgChunksUsed: number | null;
  avgTopKScore: number | null;
  topTools: Array<{ name: string; count: number }>;
};

export interface ClinicalChatInteractionLogRepository {
  findById(id: ClinicalChatInteractionLogId): Promise<ClinicalChatInteractionLog | null>;

  /** Lista todos os logs de uma sessão, ordenados por createdAt desc. */
  findBySessionId(sessionId: PatientChatSessionId): Promise<ClinicalChatInteractionLog[]>;

  save(log: ClinicalChatInteractionLog): Promise<void>;

  getInteractionMetrics(from: Date, to: Date): Promise<InteractionMetrics>;
}

export abstract class ClinicalChatInteractionLogRepository {}
