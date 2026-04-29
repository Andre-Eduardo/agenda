import { Given, When, Then } from "@cucumber/cucumber";
import { chai } from "../support/chai-setup";
import type { Context } from "../support/context";

// ---------------------------------------------------------------------------
// Types for RAG retrieval responses
// ---------------------------------------------------------------------------
type ChunkItem = {
  id: string;
  content: string;
  sourceType: string;
  score: number;
  patientId: string;
};

type RetrieveChunksResponse = {
  chunks: ChunkItem[];
  snapshotAvailable: boolean;
  totalChunks: number;
};

// ---------------------------------------------------------------------------
// Internal helpers — store state in scenario variables
// ---------------------------------------------------------------------------
const RAG_PROF_KEY = "rag_professional";

function setLastPatientKey(context: Context, key: string): void {
  (context.variables as Record<string, unknown>).lastRagPatientKey = key;
}

function getLastPatientKey(context: Context): string {
  const key = (context.variables as Record<string, unknown>).lastRagPatientKey;

  if (typeof key !== "string") {
    throw new TypeError('No patient created yet. Use "um paciente X com evolução Y" first.');
  }

  return key;
}

function setLastChunksResponse(context: Context, response: RetrieveChunksResponse): void {
  (context.variables as Record<string, unknown>).lastRagChunksResponse = response;
}

function getLastChunksResponse(context: Context): RetrieveChunksResponse {
  const resp = (context.variables as Record<string, unknown>).lastRagChunksResponse;

  if (!resp) {
    throw new Error('No chunk retrieval performed yet. Call a "consulto chunks" step first.');
  }

  return resp as RetrieveChunksResponse;
}

// ---------------------------------------------------------------------------
// Given — professional setup
// ---------------------------------------------------------------------------

/**
 * Creates a user and professional with the given specialty, then signs in with
 * the professional context. Subsequent patient/record steps rely on this setup.
 *
 * Example:
 *   Given um profissional logado com especialidade "MEDICINA"
 */
Given(
  "um profissional logado com especialidade {string}",
  async function (this: Context, specialty: string) {
    const uniqueUsername = this.getUniqueValue(RAG_PROF_KEY);
    const email = `${uniqueUsername}@test.agenda.dev`;
    const password = "RagProf@1234";

    // 1. Create user
    const userResp = await this.agent.post("/api/v1/user/sign-up").send({
      name: "RAG Professional",
      username: uniqueUsername,
      email,
      password,
    });

    chai
      .expect(userResp.status, `User creation failed: ${JSON.stringify(userResp.body)}`)
      .to.equal(201);
    this.setVariableId("user", RAG_PROF_KEY, userResp.body.id as string);

    // 2. Sign in as user (needed to create professional)
    const signInResp = await this.agent.post("/api/v1/auth/sign-in").send({
      username: uniqueUsername,
      password,
    });

    chai
      .expect(signInResp.status, `Sign-in failed: ${JSON.stringify(signInResp.body)}`)
      .to.equal(200);

    // 3. Create professional
    const profResp = await this.agent.post("/api/v1/professionals").send({
      name: "RAG Professional",
      specialty,
      documentId: `000.000.000-0${Math.floor(Math.random() * 9)}`,
      userId: userResp.body.id,
    });

    chai
      .expect(profResp.status, `Professional creation failed: ${JSON.stringify(profResp.body)}`)
      .to.equal(201);
    this.setVariableId("professional", RAG_PROF_KEY, profResp.body.id as string);

    // 4. Sign in again with professional context
    this.clearAgent();
    const signInProfResp = await this.agent.post("/api/v1/auth/sign-in").send({
      username: uniqueUsername,
      password,
      professionalId: profResp.body.id,
    });

    chai
      .expect(
        signInProfResp.status,
        `Professional sign-in failed: ${JSON.stringify(signInProfResp.body)}`,
      )
      .to.equal(200);
  },
);

// ---------------------------------------------------------------------------
// Given — patient + record + index
// ---------------------------------------------------------------------------

/**
 * Creates a patient with the given name, creates a record with the evolution
 * text, and immediately rebuilds/indexes the patient's chunks for RAG.
 *
 * The last created patient is tracked via context variables so that subsequent
 * steps can reference it without repeating the name.
 *
 * Example:
 *   Given um paciente "João" com evolução "Paciente com glicemia de 180 mg/dL em jejum"
 */
Given(
  "um paciente {string} com evolução {string}",
  async function (this: Context, name: string, evolution: string) {
    const profId = this.getVariableId("professional", RAG_PROF_KEY);

    // 1. Create patient
    const patientResp = await this.agent.post("/api/v1/patients").send({
      name: this.getUniqueValue(name),
      documentId: `${String(Math.floor(Math.random() * 900) + 100)}.${String(Math.floor(Math.random() * 900) + 100)}.${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 90) + 10)}`,
      professionalId: profId,
    });

    chai
      .expect(
        patientResp.status,
        `Patient creation failed for "${name}": ${JSON.stringify(patientResp.body)}`,
      )
      .to.equal(201);
    const patientId = patientResp.body.id as string;

    this.setVariableId("patient", name, patientId);
    setLastPatientKey(this, name);

    // 2. Create clinical record with the evolution text
    const recordResp = await this.agent.post("/api/v1/records").send({
      patientId,
      professionalId: profId,
      freeNotes: evolution,
      eventDate: new Date().toISOString(),
    });

    chai
      .expect(
        recordResp.status,
        `Record creation failed for patient "${name}": ${JSON.stringify(recordResp.body)}`,
      )
      .to.equal(201);

    // 3. Index patient chunks (rebuild context snapshot)
    const rebuildResp = await this.agent
      .post("/api/v1/clinical-chat/context/rebuild")
      .send({ patientId, reindex: true });

    chai
      .expect(
        rebuildResp.status,
        `Context rebuild failed for patient "${name}": ${JSON.stringify(rebuildResp.body)}`,
      )
      .to.equal(200);
  },
);

/**
 * Re-indexes the chunks for the last created patient. Idempotent — useful to
 * make the indexing step explicit in scenarios that focus on scoring.
 *
 * Example:
 *   And os chunks do paciente foram indexados
 */
Given("os chunks do paciente foram indexados", async function (this: Context) {
  const lastKey = getLastPatientKey(this);
  const patientId = this.getVariableId("patient", lastKey);

  const rebuildResp = await this.agent
    .post("/api/v1/clinical-chat/context/rebuild")
    .send({ patientId, reindex: true });

  chai
    .expect(rebuildResp.status, `Re-index failed: ${JSON.stringify(rebuildResp.body)}`)
    .to.equal(200);
});

// ---------------------------------------------------------------------------
// When — chunk retrieval
// ---------------------------------------------------------------------------

/**
 * Retrieves chunks for the last created patient using the given query.
 *
 * Example:
 *   When consulto chunks com query "diabetes açúcar elevado"
 */
When("consulto chunks com query {string}", async function (this: Context, query: string) {
  const lastKey = getLastPatientKey(this);
  const patientId = this.getVariableId("patient", lastKey);

  const response = await this.agent.get("/api/v1/clinical-chat/context/retrieve").query({
    patientId,
    query,
    topK: 5,
    minScore: 0,
  });

  chai
    .expect(response.status, `Chunk retrieval failed: ${JSON.stringify(response.body)}`)
    .to.equal(200);

  setLastChunksResponse(this, response.body as RetrieveChunksResponse);
});

/**
 * Retrieves chunks for a specific named patient using the given query.
 *
 * Example:
 *   When consulto chunks do paciente "João" com query "doença respiratória"
 */
When(
  "consulto chunks do paciente {string} com query {string}",
  async function (this: Context, name: string, query: string) {
    const patientId = this.getVariableId("patient", name);

    const response = await this.agent.get("/api/v1/clinical-chat/context/retrieve").query({
      patientId,
      query,
      topK: 5,
      minScore: 0,
    });

    chai
      .expect(
        response.status,
        `Chunk retrieval failed for "${name}": ${JSON.stringify(response.body)}`,
      )
      .to.equal(200);

    setLastChunksResponse(this, response.body as RetrieveChunksResponse);
  },
);

// ---------------------------------------------------------------------------
// Then — assertions on retrieved chunks
// ---------------------------------------------------------------------------

/**
 * Asserts that the first chunk has a similarity score greater than the given threshold.
 *
 * Example:
 *   Then o primeiro chunk tem score > 0.7
 */
Then("o primeiro chunk tem score > {float}", function (this: Context, minScore: number) {
  const { chunks } = getLastChunksResponse(this);

  chai.expect(chunks.length, "Expected at least one chunk to be returned").to.be.greaterThan(0);
  chai
    .expect(chunks[0].score, `Expected first chunk score ${chunks[0].score} to be > ${minScore}`)
    .to.be.greaterThan(minScore);
});

/**
 * Asserts that the first returned chunk contains the expected text (case-insensitive).
 *
 * Example:
 *   And o primeiro chunk contém "glicemia"
 */
Then("o primeiro chunk contém {string}", function (this: Context, text: string) {
  const { chunks } = getLastChunksResponse(this);

  chai.expect(chunks.length, "Expected at least one chunk to be returned").to.be.greaterThan(0);
  chai.expect(chunks[0].content.toLowerCase()).to.include(text.toLowerCase());
});

/**
 * Asserts that none of the returned chunks contain the given text (case-insensitive).
 * Validates patient isolation — chunks from other patients must not appear.
 *
 * Example:
 *   Then nenhum chunk retornado menciona "asma"
 */
Then("nenhum chunk retornado menciona {string}", function (this: Context, text: string) {
  const { chunks } = getLastChunksResponse(this);
  const lowerText = text.toLowerCase();

  for (const chunk of chunks) {
    chai
      .expect(
        chunk.content.toLowerCase(),
        `Chunk ${chunk.id} (patient ${chunk.patientId}) should not contain "${text}"`,
      )
      .to.not.include(lowerText);
  }
});
