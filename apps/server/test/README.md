# Integration Tests — @agenda-app/server

BDD integration tests using Cucumber.js. Tests run against a real PostgreSQL database (`test_integration_agenda`) with a full NestJS application boot per scenario.

## Running tests

```bash
# All standard tests (excludes @real-api)
pnpm -F @agenda-app/server test:integration

# Single feature file
pnpm -F @agenda-app/server exec cucumber-js test/features/auth/sign-in.feature

# Specific tag
pnpm -F @agenda-app/server exec cucumber-js --tags '@smoke'
```

## @real-api tests

Tests tagged `@real-api` require live AI provider credentials and are excluded from normal CI/local runs. They validate actual embedding similarity (pgvector + HNSW) end-to-end.

**How to run manually:**

```bash
AI_EMBEDDING_PROVIDER=openai \
OPENAI_API_KEY=sk-... \
pnpm -F @agenda-app/server exec cucumber-js --tags '@real-api'
```

**Features covered:**

| Feature                 | File                                                         | What it validates                                                                                                   |
| ----------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| RAG semantic similarity | `test/features/clinical-chat/rag-patient-similarity.feature` | pgvector + HNSW + OpenAI embeddings return semantically relevant chunks (score > 0.7) and enforce patient isolation |

**Pre-requisites:**

- PostgreSQL running with pgvector extension
- Valid `OPENAI_API_KEY` environment variable
- `AI_EMBEDDING_PROVIDER=openai` (defaults to mock in tests)

## Test infrastructure

| File                                    | Purpose                                                           |
| --------------------------------------- | ----------------------------------------------------------------- |
| `test/support/context.ts`               | Per-scenario `Context` class extending Cucumber `World`           |
| `test/support/setup.ts`                 | `BeforeAll` (migrations), `Before` (app boot), `After` (teardown) |
| `test/support/parser.ts`                | Reference resolution (`${ref:id:user:john_doe}`)                  |
| `test/support/data-table-converters.ts` | `singleEntry` / `multipleEntries` DataTable helpers               |
| `test/support/chai-setup.ts`            | chai + chai-match-pattern + chai-subset                           |

## Step definition reference

| Pattern                                                   | File              | Description                            |
| --------------------------------------------------------- | ----------------- | -------------------------------------- |
| `the following users exist:`                              | `user.ts`         | Bulk user creation from DataTable      |
| `I am signed in as {string}`                              | `user.ts`         | Sign in by username                    |
| `a professional {string} exists with specialty {string}`  | `professional.ts` | Create professional                    |
| `I send a {string} request to {string} with:`             | `request.ts`      | HTTP request with body                 |
| `I send a {string} request to {string} with the query:`   | `request.ts`      | HTTP request with query params         |
| `um profissional logado com especialidade {string}`       | `rag-patient.ts`  | RAG: create user+professional, sign in |
| `um paciente {string} com evolução {string}`              | `rag-patient.ts`  | RAG: create patient + record + index   |
| `os chunks do paciente foram indexados`                   | `rag-patient.ts`  | RAG: re-index last patient             |
| `consulto chunks com query {string}`                      | `rag-patient.ts`  | RAG: retrieve chunks for last patient  |
| `consulto chunks do paciente {string} com query {string}` | `rag-patient.ts`  | RAG: retrieve chunks for named patient |
| `o primeiro chunk tem score > {float}`                    | `rag-patient.ts`  | Assert first chunk similarity score    |
| `o primeiro chunk contém {string}`                        | `rag-patient.ts`  | Assert first chunk content             |
| `nenhum chunk retornado menciona {string}`                | `rag-patient.ts`  | Assert patient isolation               |

## Dynamic references

Use `${ref:...}` placeholders in feature files to reference dynamic values:

```gherkin
| professionalId | ${ref:id:professional:dr_house} |
| patientId      | ${ref:id:patient:joao}          |
| username       | ${ref:var:contextId}            |
```

Each scenario gets a unique `contextId` (8-char hex) appended to usernames/emails to prevent collisions between parallel workers.
