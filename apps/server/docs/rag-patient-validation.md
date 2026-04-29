# RAG Patient — Baseline de Validação

## 1. Fluxo Patient-RAG

```
Pergunta do profissional
        ↓
1. EmbeddingProvider.generateEmbedding(query)   → vetor 1536 dims (OpenAI)
        ↓
2. PatientContextChunkRepository.searchSimilar  → cosine similarity via pgvector HNSW
   WHERE patient_id = :patientId                ← isolamento garantido por código
        ↓
3. RetrievePatientChunksService                 → filtra por minScore, re-ranqueia
   relevância (70%) + recência (30%)
        ↓
4. ContextPolicyService.applyToChunks           → filtra por allowedSources + minDate
        ↓
5. Top-K chunks → contexto do prompt → LLM → resposta
```

**Garantias de segurança:**

- `ContextPolicyService.assertPatientIdRequired` lança `PreconditionException` se `patientId` estiver ausente.
- Nenhuma query ao repositório ocorre sem `patientId` — isolamento por paciente é aplicado em código, não só por convenção.
- O `EmbeddingProvider` é completamente desacoplado do `ChatProvider`: trocar o modelo de chat nunca afeta embeddings indexados.

---

## 2. Dez perguntas de validação

> **Como usar:** para cada pergunta, execute a chamada de API (seção 3), compare a resposta com os critérios abaixo. Um score médio `avgScore ≥ 0.70` indica RAG funcionando corretamente.

---

### Q1 — Glicemia / Diabetes

| Campo                                 | Valor                                                               |
| ------------------------------------- | ------------------------------------------------------------------- |
| **Query**                             | `"glicemia em jejum diabetes"`                                      |
| **Chunks esperados (conteúdo-chave)** | Evolução com menção a `glicemia`, `mg/dL`, `diabetes` ou `insulina` |
| **Score mínimo**                      | `0.72`                                                              |
| **Especialidades relevantes**         | Medicina, Nutricão                                                  |

---

### Q2 — Pressão arterial / Hipertensão

| Campo                | Valor                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------- |
| **Query**            | `"pressão arterial sistólica hipertensão"`                                                |
| **Chunks esperados** | Records com `mmHg`, `hipertensão arterial`, `anti-hipertensivo` ou `amlodipina/losartana` |
| **Score mínimo**     | `0.70`                                                                                    |

---

### Q3 — Alergia a medicamento

| Campo                   | Valor                                                              |
| ----------------------- | ------------------------------------------------------------------ |
| **Query**               | `"alergia medicamento contraindicação"`                            |
| **Chunks esperados**    | AlertPatient com `severity HIGH/MEDIUM`, `alergia` ou `anafilaxia` |
| **Score mínimo**        | `0.68`                                                             |
| **sourceType esperado** | `PATIENT_ALERT`                                                    |

---

### Q4 — Última evolução SOAP

| Campo                | Valor                                                                                |
| -------------------- | ------------------------------------------------------------------------------------ |
| **Query**            | `"evolução última consulta plano terapêutico"`                                       |
| **Chunks esperados** | Chunk de seção `plan` ou `assessment` do record mais recente                         |
| **Score mínimo**     | `0.65`                                                                               |
| **Obs.**             | O chunk mais recente deve aparecer antes de chunks antigos (re-ranking por recência) |

---

### Q5 — Resultado de exame de TSH

| Campo                   | Valor                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------- |
| **Query**               | `"TSH tireóide resultado exame laboratorial"`                                       |
| **Chunks esperados**    | Campo de formulário com label `TSH` ou `tireotropina`, ou record com menção a `TSH` |
| **Score mínimo**        | `0.68`                                                                              |
| **sourceType esperado** | `PATIENT_FORM` ou `RECORD`                                                          |

---

### Q6 — Histórico de cirurgia

| Campo                   | Valor                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------- |
| **Query**               | `"cirurgia procedimento cirúrgico histórico"`                                          |
| **Chunks esperados**    | Perfil clínico com `surgicalHistory` preenchido ou record com `procedimento cirúrgico` |
| **Score mínimo**        | `0.65`                                                                                 |
| **sourceType esperado** | `CLINICAL_PROFILE` ou `RECORD`                                                         |

---

### Q7 — Evolução de psicologia (sessão)

| Campo                | Valor                                                                            |
| -------------------- | -------------------------------------------------------------------------------- |
| **Query**            | `"sessão psicoterapia humor ansiedade depressão"`                                |
| **Chunks esperados** | Record de especialidade `PSICOLOGIA` com `subjective` ou `freeNotes` preenchidos |
| **Score mínimo**     | `0.70`                                                                           |
| **Especialidade**    | Psicologia                                                                       |

---

### Q8 — Medicação atual

| Campo                   | Valor                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| **Query**               | `"medicamentos em uso prescrição atual"`                                       |
| **Chunks esperados**    | Perfil clínico com `currentMedications` ou record com listagem de medicamentos |
| **Score mínimo**        | `0.67`                                                                         |
| **sourceType esperado** | `CLINICAL_PROFILE` ou `RECORD`                                                 |

---

### Q9 — Fisioterapia — dor e mobilidade

| Campo                | Valor                                                                      |
| -------------------- | -------------------------------------------------------------------------- |
| **Query**            | `"dor musculoesquelética amplitude de movimento fisioterapia"`             |
| **Chunks esperados** | Record de fisioterapia com `objective` descrevendo amplitude, força ou dor |
| **Score mínimo**     | `0.68`                                                                     |
| **Especialidade**    | Fisioterapia                                                               |

---

### Q10 — Isolamento: zero contaminação cross-patient

| Campo            | Valor                                                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Query**        | `"qualquer query do paciente A"`                                                                                                 |
| **Critério**     | Nenhum chunk retornado deve ter `patientId` diferente do paciente consultado                                                     |
| **Score mínimo** | N/A — critério binário                                                                                                           |
| **Como testar**  | Criar dois pacientes com evoluções distintas; consultar chunks do paciente A e verificar que nenhum chunk pertence ao paciente B |

---

## 3. Como executar a validação manualmente

### Pré-requisitos

```bash
# .env ou variáveis de ambiente
AI_EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-...

# Banco com pgvector ativo e dados reais indexados
DATABASE_URL=postgresql://...
```

### Passo a passo

**1. Autenticar e obter cookie:**

```bash
curl -c cookies.txt -X POST http://localhost:3000/api/v1/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"username": "seu_usuario", "password": "sua_senha"}'
```

**2. Indexar chunks do paciente (se ainda não indexados):**

```bash
curl -b cookies.txt -X POST http://localhost:3000/api/v1/clinical-chat/context/rebuild \
  -H "Content-Type: application/json" \
  -d '{"patientId": "<UUID_DO_PACIENTE>", "reindex": true}'
```

**3. Consultar chunks para uma query:**

```bash
curl -b cookies.txt \
  "http://localhost:3000/api/v1/clinical-chat/context/retrieve?patientId=<UUID>&query=glicemia+em+jejum+diabetes&topK=5&minScore=0"
```

**Resposta esperada:**

```json
{
  "chunks": [
    {
      "id": "...",
      "content": "Paciente com glicemia de 180 mg/dL em jejum...",
      "sourceType": "RECORD",
      "score": 0.82,
      "patientId": "<UUID_DO_PACIENTE>"
    }
  ],
  "snapshot": { "patientFacts": {...}, "criticalContext": [...] },
  "totalChunks": 3
}
```

**4. Critérios de aprovação:**

- `chunks[0].score ≥ score_mínimo` da pergunta
- `chunks[0].content` contém palavras-chave esperadas (case-insensitive)
- Todos os chunks têm `patientId === <UUID_DO_PACIENTE>` (isolamento)

### Rodar testes @real-api automatizados

```bash
AI_EMBEDDING_PROVIDER=openai \
OPENAI_API_KEY=sk-... \
pnpm -F @agenda-app/server exec cucumber-js --tags '@real-api'
```

---

## 4. Interpretação dos resultados

| Score médio   | Interpretação                                                                          |
| ------------- | -------------------------------------------------------------------------------------- |
| `≥ 0.80`      | RAG excelente — embeddings bem calibrados para o conteúdo clínico                      |
| `0.70 – 0.79` | RAG bom — aceitável para produção                                                      |
| `0.60 – 0.69` | RAG marginal — revisar qualidade dos chunks (conteúdo muito curto ou mal normalizado?) |
| `< 0.60`      | RAG problemático — verificar modelo de embedding, dimensão do vetor, índice HNSW       |

**Causas comuns de score baixo:**

1. Chunks muito curtos (< 50 chars) — verificar `normalizeText` no `IndexPatientChunksService`
2. Índice HNSW desatualizado — executar `REINDEX INDEX patient_context_chunk_embedding_hnsw_idx`
3. Modelo de embedding diferente entre indexação e consulta — verificar `AI_EMBEDDING_PROVIDER`
4. Paciente sem chunks indexados — executar rebuild antes de consultar
