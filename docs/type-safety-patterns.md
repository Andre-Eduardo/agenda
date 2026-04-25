# Type Safety Patterns

Regras e padrões para manter o código do server type-safe. **Sempre leia este documento antes de criar ou editar features.**

> Princípio geral: casts (`as`, `as any`, `as unknown as`, `!`, `@ts-ignore`) mascaram problemas reais e criam "tipos falsos" que não refletem os dados em runtime. A meta é **zero casts fora das fronteiras técnicas inevitáveis**. Quando uma conversão for realmente necessária, use funções de inferência que **validam** os dados em runtime e retornam o tipo correto.

---

## 1. Nunca use `as any`

`as any` desliga todas as verificações do TypeScript e é quase sempre sintoma de outro problema. Antes de escrever `as any`, tente:

| Sintoma | Solução |
|---------|---------|
| Tipos de entidades relacionadas por herança | Só passe a subclasse — `PersonRepository.save(patient)` aceita `Patient` porque `Patient extends Person` |
| Payload do Zod parece não bater com o tipo esperado | O `z.nativeEnum(X)` / `entityId(X)` / `phone()` já **transformam** — use o valor direto, sem cast |
| "Sei que esse campo é string" em acesso dinâmico | Use type guard (`instanceof`, `'key' in obj`, `typeof`) e estreite o tipo explicitamente |
| Enum do domínio vs enum do Prisma | Use `toEnum` / `toEnumOrNull` / `toEnumArray` (ver §3) |
| Input Prisma rejeita a saída do mapper | Use `satisfies Prisma.XxxUncheckedCreateInput` + normalização de `Prisma.JsonNull` (ver §5) |

**Regra**: se você está prestes a escrever `as any`, pare e documente por escrito *por que* — depois procure uma das soluções acima.

---

## 2. Não use `as` para "consertar" tipos

Um cast `value as SomeType` declara "confie em mim". Ele **não valida nada**. Quando você lê um dado de fora do domínio (Prisma, HTTP, JSON, filesystem), validação em runtime é obrigatória — não um cast.

### Padrões permitidos

| Caso | Exemplo | Justificativa |
|------|---------|---------------|
| Alias de import | `import {Record as ClinicalRecord}` | Não é um cast |
| `as const` | `['a', 'b'] as const` | Não é um cast, é narrowing |
| Type guard interno | `value as Equatable` dentro de `isEquatable()` | O guard valida antes |

### Padrões proibidos

```typescript
// ❌ Cast que esconde incompatibilidade real
const patientId = payload.patientId as unknown as PatientId;

// ❌ Cast para "sei o que estou fazendo"
const status = model.status as ChatSessionStatus;

// ❌ Cast para bypassar erro de tipagem da biblioteca
await repo.save(entity as any);

// ❌ Cast para satisfazer generics
sort: payload.sort as any,
```

---

## 3. Conversão de enum (Prisma ↔ Domínio)

Enums do Prisma (`string literal unions`) e enums do domínio (TS `enum`) têm os mesmos valores em runtime mas são tipos nominalmente diferentes. Para convertê-los **sem cast e com validação runtime**, use `@domain/@shared/utils`:

```typescript
import {toEnum, toEnumOrNull, toEnumArray} from '@domain/@shared/utils';
import * as PrismaClient from '@prisma/client';
import {Gender, ChatSessionStatus, ConductTag} from '@domain/.../entities';

// Prisma → Domínio (leitura)
gender: toEnumOrNull(Gender, model.gender),
status: toEnum(ChatSessionStatus, model.status),
conductTags: toEnumArray(ConductTag, model.conductTags ?? []),

// Domínio → Prisma (escrita)
gender: toEnumOrNull(PrismaClient.Gender, entity.gender),
status: toEnum(PrismaClient.ChatSessionStatus, entity.status),

// Filtro opcional (enum | undefined)
attendanceType: toEnumOrNull(PrismaClient.AttendanceType, filter.attendanceType) ?? undefined,
```

A função `toEnum` lança `InvalidInputException` quando o valor não pertence ao enum — é um type guard real, não uma promessa vazia.

**Quando não usar**: enums internos do domínio (sem conversão entre sistemas) já são naturalmente tipados — não precisam passar pelo helper.

---

## 4. Não caste IDs e value objects que já foram validados

Schemas Zod do projeto **transformam** o input para o tipo final:

```typescript
entityId(PatientId)   // string → PatientId
phone()               // string → Phone
documentId            // string → DocumentId
z.nativeEnum(Gender)  // string → Gender
```

Consequentemente, o `payload` de entrada de um controller/service **já é** o tipo do domínio. Cast é desnecessário:

```typescript
// ❌ redundante — payload.patientId já é PatientId
const patientId = payload.patientId as unknown as PatientId;

// ✅ apenas use
const patientId = payload.patientId;

// ❌ bug em potencial — phone() retorna Phone, não {number: Phone}
phone: props.phone ? {number: props.phone} as any : undefined,

// ✅ props.phone já é Phone | null | undefined
phone: props.phone ?? undefined,
```

O mesmo vale para campos populados de entidades: `session.patientId` já é `PatientId` (declarado na classe) — nunca caste de novo.

---

## 5. JSON fields com Prisma

Prisma distingue dois tipos para colunas JSON:
- **`JsonValue`** (leitura): inclui `null` nos tipos primitivos
- **`InputJsonValue | NullableJsonNullValueInput`** (escrita): não aceita `null` puro — precisa do sentinel `Prisma.JsonNull` para representar JSON null

Padrão correto nos repositórios:

```typescript
import {Prisma} from '@prisma/client';

async save(entity: MyEntity): Promise<void> {
    const data = this.mapper.toPersistence(entity);

    // JSON obrigatório (não-nullable no domínio): cast controlado para InputJsonValue
    // JSON opcional: Prisma.JsonNull quando null, InputJsonValue caso contrário
    const writeData: Prisma.MyEntityUncheckedCreateInput = {
        ...data,
        requiredJson: data.requiredJson as Prisma.InputJsonValue,
        optionalJson: data.optionalJson === null
            ? Prisma.JsonNull
            : (data.optionalJson as Prisma.InputJsonValue),
    };

    await this.prisma.myEntity.upsert({
        where: {id: data.id},
        create: writeData,
        update: writeData,
    });
}
```

Não use `data as any` — isso esconde o problema do JSON null e qualquer outro erro real no objeto.

---

## 6. Non-null assertions (`!`)

O `!` é um cast mentindo sobre nulabilidade. Tente sempre:

1. **Estreitar o tipo do parâmetro**: se a função só é chamada com valor não-null, tipe como não-null.
   ```typescript
   // ❌ Repetir ! em todo acesso
   private build(patient: Patient | null) {
       return {name: patient!.name, age: patient!.age};
   }

   // ✅ Assinar a função com o tipo já narrowed
   private build(patient: Patient) { ... }
   // Quem chama faz o check antes de passar
   ```

2. **Guard explícito**: use `if (!x) throw ...` ou type guard antes do acesso.

3. **Passar o valor narrowed como argumento**: se precisa chamar uma função com um valor que pode ser `null | T` após um check, passe o `T` diretamente:
   ```typescript
   if (filter.queryEmbedding && filter.queryEmbedding.length > 0) {
       // passa o array já não-nulo ao invés de usar filter.queryEmbedding! dentro
       return this.searchByVector(filter, filter.queryEmbedding, limit);
   }
   ```

4. **Construtores de entidade em `Entity.create()`**: quando `CreateEntity<T>` aceita campos opcionais que o método `create` garante preencher antes de passar ao constructor, use `props.name ?? defaultValue` em vez de `props.name!`.

---

## 7. Snapshot de entidades para eventos (`oldState`)

Para criar um snapshot do estado anterior em `change()`/`update()`, **não use** `this.toJSON() as any`:

```typescript
// ❌ toJSON serializa datas/IDs para strings; cast esconde a incompatibilidade
const oldState = new Appointment(this.toJSON() as any);

// ✅ Passe `this` diretamente — o TypeScript valida estruturalmente
const oldState = new Appointment(this);
```

A entidade já tem todas as propriedades que o constructor de `AllEntityProps<T>` espera. Padrão confirmado em `Patient`, `Professional`, `Appointment`.

---

## 8. Type guards dinâmicos

Quando um objeto tem formato conhecido mas não tipado (ex: eventos genéricos, JSON externo), escreva um type guard com validação explícita:

```typescript
// ❌ acesso dinâmico via cast
const {clinicMemberId} = domainEvent as any;

// ✅ guard + conversão validada
private extractClinicMemberId(domainEvent: DomainEvent): ClinicMemberId | null {
    if (!('clinicMemberId' in domainEvent)) return null;
    const candidate = (domainEvent as {clinicMemberId: unknown}).clinicMemberId;
    if (candidate instanceof ClinicMemberId) return candidate;
    if (typeof candidate === 'string' && candidate.length > 0) {
        return ClinicMemberId.from(candidate);
    }
    return null;
}
```

---

## 9. Filtragem tipada de arrays

Ao filtrar um array de `string[]` para manter apenas os valores de um enum, use predicate narrowing:

```typescript
// ❌ cast mascarando possíveis inválidos
sourceTypes: agentProfile.allowedSources as any[],

// ✅ função que valida e tipa
function toContextChunkSourceTypes(sources: string[]): ContextChunkSourceType[] {
    const valid = new Set<string>(Object.values(ContextChunkSourceType));
    return sources.filter((s): s is ContextChunkSourceType => valid.has(s));
}
```

---

## 10. Checklist antes de commit

Rode este grep no código que você está tocando:

```bash
# zero matches esperados em src/ (fora de __tests__)
grep -rE "\bas any\b|as unknown as|! *\." apps/server/src/
```

Fontes aceitáveis de casts remanescentes:

- **`@shared/utils/enum-converter.ts`** — a implementação do helper
- **`infrastructure/repository/prisma/prisma.provider.ts`** — proxy dinâmico para PrismaService
- **`application/@shared/validation/dto/zod.dto.ts`** — workaround documentado NestJS Swagger + Zod
- **Mappers entre JSON domain ↔ `Prisma.JsonValue`** — comentário explicando por que cast é estrutural
- **Compound unique do Prisma com coluna nullable** — bug conhecido do Prisma (tipo gerado exige `string` quando DB aceita `NULL`)
- **Arquivos de teste (`__tests__/`)** — escopo separado; idealmente também sem casts, mas não é bloqueante

Qualquer cast fora dessa lista precisa de justificativa por escrito em comentário no código.

---

## 11. Referência rápida

```typescript
// ✅ Leitura Prisma → Domínio em mappers
import {toEnum, toEnumOrNull, toEnumArray} from '@domain/@shared/utils';

toEnum(DomainEnum, model.field)                    // campo obrigatório
toEnumOrNull(DomainEnum, model.field)              // campo nullable
toEnumArray(DomainEnum, model.field ?? [])         // array

// ✅ Escrita Domínio → Prisma em mappers
toEnum(PrismaClient.MyEnum, entity.field)
toEnumOrNull(PrismaClient.MyEnum, entity.field)

// ✅ Snapshot de entidade para eventos
const oldState = new MyEntity(this);

// ✅ IDs/value objects de payloads Zod — nunca caste
const id = payload.id;              // já é MyEntityId
const phone = payload.phone;        // já é Phone | null | undefined

// ✅ JSON fields na escrita
import {Prisma} from '@prisma/client';
const writeData: Prisma.MyEntityUncheckedCreateInput = {
    ...data,
    requiredJson: data.requiredJson as Prisma.InputJsonValue,
    nullableJson: data.nullableJson === null ? Prisma.JsonNull : data.nullableJson,
};
```
