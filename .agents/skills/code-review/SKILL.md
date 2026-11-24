---
name: code-review
description: Review code quality, patterns, and best practices. Use when Reviewing code changes for quality, Checking adherence to coding standards, or Identifying potential bugs or issues
---

# Code Review

Use this skill to inspect code for correctness, maintainability, and higher-order risks before changes move forward.

## Workflow
1. Understand the context and purpose of the code
2. Check for correctness and logic errors
3. Evaluate code structure and organization
4. Look for potential performance issues
5. Check for security vulnerabilities
6. Verify error handling is appropriate
7. Assess readability and maintainability
8. **Type safety audit (server code)**: verificar conformidade com `docs/type-safety-patterns.md` — ver seção abaixo

## Examples
**Code quality feedback:**
```
// Before: Nested callbacks
fetchUser(id, (user) => {
  fetchPosts(user.id, (posts) => {
    render(posts);
  });
});

// Suggestion: Use async/await
const user = await fetchUser(id);
const posts = await fetchPosts(user.id);
render(posts);
```

**Security feedback:**
```
// Issue: SQL injection vulnerability
const query = `SELECT * FROM users WHERE id = ${userId}`;

// Fix: Use parameterized query
const query = 'SELECT * FROM users WHERE id = ?';
db.query(query, [userId]);
```

## Type safety audit (apps/server)

Para código do server (`apps/server/src/`) sinalize como defeito qualquer:

- `as any` — **sempre** um red flag. Peça remoção ou justificativa escrita no código.
- `as unknown as X` — só aceitável nas exceções listadas em §10 de `docs/type-safety-patterns.md` (proxy do Prisma, workaround Zod/Swagger, JSON structural).
- `value as SomeEnum` para enums Prisma ↔ domínio — substitua por `toEnum` / `toEnumOrNull` / `toEnumArray` de `@domain/@shared/utils`.
- Non-null assertions (`foo!.bar`, `getValue()!`) — peça para estreitar o tipo do parâmetro ou usar guard explícito.
- Cast em IDs vindos de payload Zod (`payload.patientId as PatientId`) — já são tipados pelo `entityId()`; remova.
- `data as any` em `upsert`/`create` do Prisma — substitua por `satisfies Prisma.XxxUncheckedCreateInput` + normalização `Prisma.JsonNull`.
- `this.toJSON() as any` para criar `oldState` de evento — use `new Entity(this)`.

Grep útil para incluir no review:
```bash
grep -rE "\bas any\b|as unknown as|![ \t]*\." apps/server/src/ --include="*.ts" | grep -v __tests__
```

Referência obrigatória: [`docs/type-safety-patterns.md`](../../docs/type-safety-patterns.md).

## Quality Bar
- Focus on the most impactful issues first
- Explain why something is a problem
- Provide concrete suggestions for improvement
- Consider the developer's experience level
- Balance thoroughness with pragmatism
- Praise good patterns when you see them

## Resource Strategy
- Add `scripts/` only when the task is fragile, repetitive, or benefits from deterministic execution.
- Add `references/` only when details are too large or too variant-specific to keep in `SKILL.md`.
- Add `assets/` only for files that will be consumed in the final output.
- Keep extra docs out of the skill folder; prefer `SKILL.md` plus only the resources that materially help.
