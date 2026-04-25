# Task B — Analysis: AI Pre-Evolution (Draft)

## Existing code surveyed

| Model / File | Key finding |
|---|---|
| `ImportedDocument` | 11-state pipeline (`UPLOADED` → `AI_STRUCTURED` → `READY_FOR_REVIEW` → `APPROVED`); has `reviewRequired`, `aiConfidence` |
| `ExtractedField` | Per-field storage with `rawValue`, `structuredValue`, `confidence`, `correctedValue`, `needsReview` |
| `Record` | Has `source=IMPORT`, `wasHumanEdited`, `importedDocumentId` FK — ready for traceability |
| `pre-evolution.dto.ts` | `PreEvolutionDto` + `PreEvolutionStatus` already defined but not backed by a DB model |
| `DraftRecordEvolutionTool` | AI agent creates a `Record` directly with `wasHumanEdited=false` — bypasses the structured draft → approval cycle |
| `PatientChatSession` | Separate RAG context; future source for drafts |

## Decision: new `DraftEvolution` model

**Rejected alternatives:**
- **Re-use `ImportedDocument` fields**: The 11-state pipeline is already stable; embedding SOAP fields in a document-import model mixes concerns and makes future non-import sources (chat, voice) awkward.
- **State-within-Record**: Using `wasHumanEdited=false` + a special status field on `Record` would mean the draft *is already a Record* — violating the requirement that AI content must not become a Record without approval.

**Chosen approach — `DraftEvolution` as a dedicated staging model:**
- Independent lifecycle (`DRAFT` → `PENDING_REVIEW` → `APPROVED` / `REJECTED`)
- Mirrors SOAP fields of `Record` (explicit columns, not JSONB) — easier to query and diff
- `importedDocumentId?: string` is nullable to accommodate future chat/voice sources
- `recordId?: string` is set (uniquely) upon approval — the FK proves the lineage
- `wasHumanEdited` tracks whether any field was edited before approval
- Per-field confidence is read from `ExtractedField` (already stored) rather than duplicated
- `approvedByMemberId` + `approvedAt` = full audit trail without a separate table

## How approval works

```
GET /imported-documents/:id/draft        — creates or returns the DraftEvolution
PATCH /imported-documents/:id/draft      — professional edits fields (sets wasHumanEdited=true)
POST /imported-documents/:id/approve     — validates, creates Record, sets draft status=APPROVED
```

When `POST .../approve` is called:
1. `DraftEvolution.status` must be `DRAFT` or `PENDING_REVIEW` (not already `APPROVED`/`REJECTED`)
2. `Record.create({source=IMPORT, wasHumanEdited=draft.wasHumanEdited, importedDocumentId})` is called
3. `DraftEvolution.recordId` is set to the new Record's id and `status=APPROVED`
4. `ImportedDocument.status` advances to `APPROVED`
5. `DraftApprovedEvent` is dispatched for audit trail

## What is NOT implemented (out of scope)

- Generating the draft from AI (populating fields from `ExtractedField`) — the "generate draft" step requires AI provider integration that is out of scope; the `GET .../draft` endpoint just materializes an empty or pre-populated draft model
- Chat-based draft creation — foundation is in place (`importedDocumentId` nullable) but no endpoint
