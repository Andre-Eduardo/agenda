---
name: type-safety-audit
description: Audit server code for casts (as any, as unknown as, non-null assertions) and refactor them using the project's type-safe patterns. Use when removing casts, enforcing type safety, or reviewing a branch for cast regressions.
user_invocable: true
---

# Type Safety Audit

Audita `apps/server/src/` em busca de casts desnecessários e refatora seguindo `docs/type-safety-patterns.md`.

## Quando usar

- Usuário pede para "remover casts", "eliminar as any", "melhorar type safety"
- Review de PR/branch para garantir que nenhum cast novo foi introduzido
- Sanity check periódico da saúde da tipagem

## Workflow

1. **Levantar o inventário de casts** em produção (excluindo testes):
   ```bash
   grep -rnE "\bas any\b" apps/server/src/ --include="*.ts" | grep -v __tests__
   grep -rnE "as unknown as" apps/server/src/ --include="*.ts" | grep -v __tests__
   grep -rnE "![ \t]*\." apps/server/src/ --include="*.ts" | grep -v __tests__
   grep -rn "@ts-ignore\|@ts-expect-error\|@ts-nocheck" apps/server/src/ --include="*.ts" | grep -v __tests__
   ```

2. **Classificar cada cast** em uma das categorias:

   | Categoria | Ação |
   |-----------|------|
   | Cast em ID/VO já transformado pelo Zod (`payload.x as Y`) | Remover |
   | Herança de entidade (`patient as any` passada para `PersonRepository`) | Remover — herança já resolve |
   | Enum Prisma ↔ domínio | Substituir por `toEnum`/`toEnumOrNull`/`toEnumArray` |
   | `data as any` em Prisma `upsert`/`create` | `satisfies Prisma.XxxUncheckedCreateInput` + `Prisma.JsonNull` |
   | `this.toJSON() as any` para `oldState` | `new Entity(this)` |
   | `!` em entidade após check do chamador | Estreitar parâmetro para não-nullable |
   | `!` dentro de método privado após guard no chamador | Passar valor narrowed como argumento |
   | `domainEvent as any` para acesso dinâmico | Type guard com `'key' in obj` + `instanceof` |
   | Cast de sort/filter genérico | Os tipos do schema de paginação já casam — remover |
   | Filter de array `string[]` → `Enum[]` | Função predicate `.filter((s): s is E => ...)` |

3. **Justificativas aceitáveis** (manter, mas documentar no código):
   - Proxy de `PrismaService` em `prisma.provider.ts`
   - Workaround NestJS Swagger + Zod em `zod.dto.ts`
   - JSON domain ↔ `Prisma.JsonValue` quando validação runtime não é viável
   - Compound unique do Prisma com coluna nullable (bug conhecido)
   - Bridge estrutural (proxy, mock) com comentário explicativo

4. **Refatorar** aplicando a primeira categoria aplicável da tabela §2.

5. **Validar** a cada passo:
   ```bash
   pnpm -F @agenda-app/server typecheck
   ```

6. **Não rodar** testes de integração ou build completo se o usuário só pediu audit/refactor.

## Helpers disponíveis

Já existem em `apps/server/src/domain/@shared/utils/enum-converter.ts`:

```typescript
toEnum<T>(enumType: T, value: string): T[keyof T]              // lança se inválido
toEnumOrNull<T>(enumType: T, value: string | null | undefined) // retorna null se null/undefined
toEnumArray<T>(enumType: T, values: readonly string[]): T[keyof T][]
```

Importe de `@domain/@shared/utils` (barrel) — não precisa criar novos helpers para enum.

## Anti-padrões a corrigir proativamente

- Nunca troque `as any` por `as unknown as X` "camuflado" — isso só muda o sintoma. Se o cast é necessário, é `as unknown as X` **com comentário explicando por que** runtime validation não é viável.
- Não adicione `// eslint-disable-next-line @typescript-eslint/no-explicit-any` — prefira a refatoração.
- Não "resolva" erros de JSON do Prisma com `as any`; sempre use `satisfies` + `Prisma.JsonNull`.

## Reporting

Ao terminar, apresente ao usuário:

- Casts removidos (file:line, com mudança concisa)
- Casts refatorados para `toEnum*` ou `satisfies`
- Casts mantidos com justificativa
- Resultado do typecheck
- Diferença baseline vs. pós: `N casts antes → M casts depois`

## Referências

- `docs/type-safety-patterns.md` — regras completas
- `apps/server/src/domain/@shared/utils/enum-converter.ts` — implementação dos helpers
- `docs/backend-style-guide.md` — seção "Type Safety"
