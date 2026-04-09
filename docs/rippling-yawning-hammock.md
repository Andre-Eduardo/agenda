# Plano: Validações Completas de Agendamento

## Contexto

O sistema de agendamentos existe com CRUD básico, mas sem nenhuma validação de negócio real: não verifica conflito de horário, não valida disponibilidade do profissional, não controla transições de status e não bloqueia sobreposição de agendamentos. O objetivo é implementar todas as validações essenciais para que a marcação de atendimentos seja confiável e operacionalmente consistente.

---

## Arquivos Críticos

| Caminho | O que muda |
|---|---|
| `apps/server/prisma/schema.prisma` | Novos campos/modelos |
| `apps/server/src/domain/appointment/entities/appointment.entity.ts` | Campos, validações, métodos de status |
| `apps/server/src/domain/appointment/appointment.repository.ts` | Novo método `findConflicts` e filtros |
| `apps/server/src/infrastructure/repository/appointment.prisma.repository.ts` | Implementação do conflict query + filtros |
| `apps/server/src/application/appointment/services/create-appointment.service.ts` | Pipeline de validação + transação |
| `apps/server/src/application/appointment/services/update-appointment.service.ts` | Pipeline de revalidação ao remarcar |
| `apps/server/src/application/appointment/dtos/create-appointment.dto.ts` | Novos campos obrigatórios |
| `apps/server/src/application/appointment/dtos/update-appointment.dto.ts` | Campos de status e reagendamento |
| `apps/server/src/application/appointment/controllers/appointment.controller.ts` | Endpoint de cancelamento |

Novos arquivos a criar:
- `apps/server/src/application/appointment/services/cancel-appointment.service.ts`
- `apps/server/src/domain/professional/entities/working-hours.entity.ts`
- `apps/server/src/domain/professional/entities/professional-block.entity.ts`

---

## Passo 1 — Prisma Schema

### 1a. Atualizar `Appointment`
- Renomear `date` → `startAt` (com migration)
- Adicionar `endAt DateTime`, `durationMinutes Int`, `type AppointmentType`
- Adicionar `CONFIRMED` e `NO_SHOW` ao enum `AppointmentStatus`

```prisma
enum AppointmentType {
  FIRST_VISIT
  RETURN
  WALK_IN
  TELEMEDICINE
  PROCEDURE
  @@map("appointment_type")
}

enum AppointmentStatus {
  SCHEDULED
  CONFIRMED
  COMPLETED
  CANCELLED
  NO_SHOW
  @@map("appointment_status")
}

model Appointment {
  // ...campos existentes...
  startAt          DateTime          @map("start_at")
  endAt            DateTime          @map("end_at")
  durationMinutes  Int               @map("duration_minutes")
  type             AppointmentType   @map("type")
  // ...
}
```

### 1b. Novo modelo `WorkingHours`
Configura disponibilidade semanal do profissional.

```prisma
model WorkingHours {
  id             String       @id @db.Uuid
  professionalId String       @map("professional_id") @db.Uuid
  professional   Professional @relation(...)
  dayOfWeek      Int          @map("day_of_week")  // 0=Dom, 6=Sab
  startTime      String       @map("start_time")   // "08:00"
  endTime        String       @map("end_time")     // "18:00"
  slotDuration   Int          @map("slot_duration") // minutos padrão do slot
  active         Boolean      @default(true)
  createdAt      DateTime     @map("created_at")
  updatedAt      DateTime     @map("updated_at")
  @@map("working_hours")
}
```

### 1c. Novo modelo `ProfessionalBlock`
Bloqueios manuais: férias, folga, almoço, ausência.

```prisma
model ProfessionalBlock {
  id             String       @id @db.Uuid
  professionalId String       @map("professional_id") @db.Uuid
  professional   Professional @relation(...)
  startAt        DateTime     @map("start_at")
  endAt          DateTime     @map("end_at")
  reason         String?
  createdAt      DateTime     @map("created_at")
  updatedAt      DateTime     @map("updated_at")
  @@map("professional_block")
}
```

---

## Passo 2 — Domínio: Entidade Appointment

### 2a. Novos campos na entidade
```typescript
startAt: Date;
endAt: Date;
durationMinutes: number;
type: AppointmentType;
```

### 2b. Métodos de transição de status
- `cancel(reason: string): void` — só se SCHEDULED ou CONFIRMED
- `confirm(): void` — só se SCHEDULED
- `complete(): void` — só se CONFIRMED ou SCHEDULED
- `noShow(): void` — só se CONFIRMED ou SCHEDULED

### 2c. `validate()` com regras básicas
```typescript
validate(): void {
  if (this.startAt >= this.endAt)
    throw new InvalidInputException([{ field: 'endAt', message: 'endAt must be after startAt' }]);
  if (this.durationMinutes <= 0)
    throw new InvalidInputException([{ field: 'durationMinutes', message: 'must be positive' }]);
}
```

---

## Passo 3 — Repositório: `findConflicts`

### 3a. Interface (domain layer)
```typescript
// appointment.repository.ts
findConflicts(
  professionalId: ProfessionalId,
  startAt: Date,
  endAt: Date,
  excludeId?: AppointmentId
): Promise<Appointment[]>;
```

Também adicionar filtros ao `AppointmentSearchFilter`:
```typescript
type AppointmentSearchFilter = {
  ids?: AppointmentId[];
  term?: string;
  professionalId?: ProfessionalId;
  patientId?: PatientId;
  status?: AppointmentStatus[];
  dateFrom?: Date;
  dateTo?: Date;
};
```

### 3b. Implementação Prisma (infrastructure layer)
```typescript
async findConflicts(professionalId, startAt, endAt, excludeId?) {
  const records = await this.prisma.appointment.findMany({
    where: {
      professionalId: professionalId.toString(),
      id: excludeId ? { not: excludeId.toString() } : undefined,
      status: { in: ['SCHEDULED', 'CONFIRMED'] }, // cancelados não bloqueiam
      startAt: { lt: endAt },
      endAt: { gt: startAt },
      deletedAt: null,
    },
  });
  return records.map(r => this.mapper.toDomain(r));
}
```

---

## Passo 4 — CreateAppointmentService: pipeline de validação

Pipeline em ordem:

```
1. Verificar que professional existe
2. Verificar que patient existe e pertence ao professional
3. Validar payload: startAt < endAt, tipo válido
4. Validar que startAt não está no passado (exceto flag retroativo)
5. Verificar WorkingHours do professional no dayOfWeek
6. Verificar ProfessionalBlocks que se sobreponham ao intervalo
7. Verificar conflito com agendamentos ativos (findConflicts)
8. Gravar em transação atômica
```

Injetar no service:
- `ProfessionalRepository` — verificar existência
- `PatientRepository` — verificar existência e vínculo
- `WorkingHoursRepository` — verificar disponibilidade
- `ProfessionalBlockRepository` — verificar bloqueios
- `PrismaProvider` — transação atômica no passo 8

Exceções usadas:
- `ResourceNotFoundException` para profissional/paciente não encontrado
- `PreconditionException` para conflito de horário, fora de disponibilidade, bloqueado
- `InvalidInputException` para startAt >= endAt, tipo inválido, data no passado

---

## Passo 5 — UpdateAppointmentService → remarcar

Ao alterar `startAt`/`endAt`, re-executar passos 3–7 do pipeline acima, passando `excludeId = appointment.id` no `findConflicts`.

Adicionar ao `change()` da entidade: não permitir alterar agendamento COMPLETED ou CANCELLED sem flag explícita.

---

## Passo 6 — CancelAppointmentService (novo)

```typescript
// cancel-appointment.service.ts
async execute({ payload: { id, reason } }) {
  const appt = await this.appointmentRepository.findById(id);
  if (!appt) throw new ResourceNotFoundException(...)
  appt.cancel(reason); // valida transição de status dentro da entidade
  await this.appointmentRepository.save(appt);
  this.eventDispatcher.dispatch(actor, appt);
  return new AppointmentDto(appt);
}
```

Endpoint novo no controller:
```
PATCH /appointments/:id/cancel
@Authorize(AppointmentPermission.CANCEL)
```

DTO:
```typescript
{ id: AppointmentId, reason: string } // reason obrigatório
```

---

## Passo 7 — DTOs atualizados

### `CreateAppointmentDto`
```typescript
{
  patientId: entityId(PatientId),
  professionalId: entityId(ProfessionalId),
  startAt: datetime,
  endAt: datetime,
  type: z.nativeEnum(AppointmentType),
  note: z.string().nullish(),
  retroactive: z.boolean().optional(), // flag para registro retroativo
}
```

### `UpdateAppointmentDto`
```typescript
{
  id: entityId(AppointmentId),
  startAt: datetime.optional(),
  endAt: datetime.optional(),
  type: z.nativeEnum(AppointmentType).optional(),
  note: z.string().nullish(),
}
```

---

## Verificação

1. **Criar agendamento válido** → `POST /appointments` com `startAt`/`endAt` dentro do horário de trabalho → retorna 201 com appointment.
2. **Conflito** → criar segundo agendamento sobreposto → retorna `PreconditionException` (409).
3. **Fora do horário** → `startAt` fora do `WorkingHours` → retorna 409.
4. **Bloqueio** → período em `ProfessionalBlock` → retorna 409.
5. **Paciente de outro profissional** → retorna `PreconditionException` (409).
6. **Data no passado** → retorna `InvalidInputException` (422).
7. **Cancelar** → `PATCH /appointments/:id/cancel` com reason → status muda para CANCELLED.
8. **Remarcar** → `PUT /appointments/:id` com novas datas → re-valida conflito excluindo o próprio id.
9. **Cancelar agendamento já COMPLETED** → retorna erro de transição de status.
10. **Migração Prisma** → `npx prisma migrate dev` sem erros, `date` renomeado para `start_at`.
