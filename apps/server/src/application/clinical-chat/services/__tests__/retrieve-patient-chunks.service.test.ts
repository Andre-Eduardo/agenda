import { mock } from "jest-mock-extended";
import { PreconditionException } from "../../../../domain/@shared/exceptions";
import {
  ContextChunkSourceType,
  PatientContextChunk,
  PatientContextChunkId,
} from "../../../../domain/clinical-chat/entities";
import type {
  PatientContextChunkRepository,
  RankedChunk,
} from "../../../../domain/clinical-chat/patient-context-chunk.repository";
import type { PatientContextSnapshotRepository } from "../../../../domain/clinical-chat/patient-context-snapshot.repository";
import type { AiProviderRegistry } from "../../../../domain/clinical-chat/ports/ai-provider-registry.port";
import type { EmbeddingProvider } from "../../../../domain/clinical-chat/ports/embedding.provider";
import { PatientId } from "../../../../domain/patient/entities";
import { ContextPolicyService } from "../context-policy.service";
import { RetrievePatientChunksService } from "../retrieve-patient-chunks.service";

const PATIENT_ID = PatientId.from("01900000-0000-7000-8000-000000000001");
const FAKE_EMBEDDING = Array.from({ length: 1536 }, (_, i) => i * 0.001);

function makeRankedChunk(
  content: string,
  score: number,
  sourceType = ContextChunkSourceType.RECORD,
): RankedChunk {
  return {
    chunk: PatientContextChunk.create({
      patientId: PATIENT_ID,
      sourceType,
      sourceId: PatientContextChunkId.generate().toString(),
      content,
      contentHash: `hash_${content.slice(0, 8).replaceAll(/\s/g, "_")}`,
    }),
    score,
  };
}

function makeService(overrides?: {
  chunkRepository?: ReturnType<typeof mock<PatientContextChunkRepository>>;
  snapshotRepository?: ReturnType<typeof mock<PatientContextSnapshotRepository>>;
  embeddingProvider?: ReturnType<typeof mock<EmbeddingProvider>>;
}) {
  const chunkRepository = overrides?.chunkRepository ?? mock<PatientContextChunkRepository>();
  const snapshotRepository =
    overrides?.snapshotRepository ?? mock<PatientContextSnapshotRepository>();
  const embeddingProvider = overrides?.embeddingProvider ?? mock<EmbeddingProvider>();
  const aiProviderRegistry = mock<AiProviderRegistry>();

  aiProviderRegistry.getEmbeddingProvider.mockReturnValue(embeddingProvider);
  embeddingProvider.generateEmbedding.mockResolvedValue(FAKE_EMBEDDING);
  chunkRepository.searchSimilar.mockResolvedValue([]);
  snapshotRepository.findByPatient.mockResolvedValue(null);

  const service = new RetrievePatientChunksService(
    chunkRepository,
    snapshotRepository,
    aiProviderRegistry,
    new ContextPolicyService(),
  );

  return { service, chunkRepository, snapshotRepository, embeddingProvider };
}

describe("RetrievePatientChunksService — edge cases", () => {
  it("throws PreconditionException when patientId is null", async () => {
    const { service } = makeService();

    await expect(
      service.execute({
        patientId: null as unknown as PatientId,
        query: "any query",
      }),
    ).rejects.toThrow(PreconditionException);
  });

  it("returns empty result when patient has no indexed chunks", async () => {
    const { service } = makeService();

    const result = await service.execute({
      patientId: PATIENT_ID,
      query: "any query",
    });

    expect(result.chunks).toHaveLength(0);
    expect(result.snapshot).toBeNull();
    expect(result.totalChunks).toBe(0);
  });

  it("calls searchSimilar with limit 0 when topK is 0", async () => {
    const { service, chunkRepository } = makeService();

    await service.execute({
      patientId: PATIENT_ID,
      query: "some query",
      topK: 0,
    });

    expect(chunkRepository.searchSimilar).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 0 }),
    );
  });

  it("filters out all chunks when minScore is 1.0 and no chunk has perfect score", async () => {
    const { service, chunkRepository } = makeService();

    chunkRepository.searchSimilar.mockResolvedValue([
      makeRankedChunk("diabetes evolution", 0.8),
      makeRankedChunk("hypertension treatment", 0.6),
    ]);

    const result = await service.execute({
      patientId: PATIENT_ID,
      query: "high blood sugar",
      minScore: 1,
    });

    expect(result.chunks).toHaveLength(0);
    expect(result.totalChunks).toBe(0);
  });

  it("returns chunks of all source types when sourceTypes is not specified", async () => {
    const { service, chunkRepository } = makeService();

    chunkRepository.searchSimilar.mockResolvedValue([
      makeRankedChunk("SOAP note content", 0.9, ContextChunkSourceType.RECORD),
      makeRankedChunk("form field values", 0.8, ContextChunkSourceType.PATIENT_FORM),
      makeRankedChunk("drug allergy alert", 0.7, ContextChunkSourceType.PATIENT_ALERT),
    ]);

    const result = await service.execute({
      patientId: PATIENT_ID,
      query: "patient clinical history",
    });

    expect(result.chunks).toHaveLength(3);
    expect(result.chunks.map((c) => c.sourceType)).toEqual(
      expect.arrayContaining([
        ContextChunkSourceType.RECORD,
        ContextChunkSourceType.PATIENT_FORM,
        ContextChunkSourceType.PATIENT_ALERT,
      ]),
    );
  });

  it("propagates error when embedding provider is unavailable", async () => {
    const embeddingProvider = mock<EmbeddingProvider>();

    embeddingProvider.generateEmbedding.mockRejectedValue(new Error("OpenAI API unreachable"));

    const { service } = makeService({ embeddingProvider });

    await expect(
      service.execute({
        patientId: PATIENT_ID,
        query: "test query",
      }),
    ).rejects.toThrow("OpenAI API unreachable");
  });

  it("propagates repository error when pgvector dimension does not match", async () => {
    const chunkRepository = mock<PatientContextChunkRepository>();

    chunkRepository.searchSimilar.mockRejectedValue(
      new Error("wrong number of dimensions 512 should be 1536"),
    );

    const { service } = makeService({ chunkRepository });

    await expect(
      service.execute({
        patientId: PATIENT_ID,
        query: "test query",
      }),
    ).rejects.toThrow("wrong number of dimensions");
  });
});
