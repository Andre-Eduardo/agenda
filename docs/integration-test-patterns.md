# Integration Test Patterns

Padrões de teste de integração adotados no servidor `@agenda-app/server`.
Os padrões foram extraídos do projeto de referência `automo-app` e adaptados para este projeto.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework BDD | [Cucumber.js](https://github.com/cucumber/cucumber-js) 11.x |
| Asserções | [Chai](https://www.chaijs.com/) + `chai-match-pattern` + `chai-subset` |
| HTTP | [supertest](https://github.com/ladjs/supertest) (agent persistente) |
| Mocks | [sinon](https://sinonjs.org/) |
| Compilação | `@swc-node/register` (sem tsc) |
| App NestJS | `@nestjs/testing` (`Test.createTestingModule`) |

---

## Estrutura de pastas

```
apps/server/
├── cucumber.mjs                  # Configuração do Cucumber
└── test/
    ├── features/                 # Arquivos .feature (linguagem Gherkin)
    │   └── auth/
    │       └── sign-in.feature   # Exemplo de feature
    ├── step-definitions/         # Implementações dos steps
    │   ├── request.ts            # Steps de requisição HTTP
    │   ├── user.ts               # Steps de usuário e autenticação
    │   └── variables.ts          # Steps de variáveis de contexto
    └── support/
        ├── chai-setup.ts         # Configuração dos matchers do Chai
        ├── context.ts            # Classe Context (estado do cenário)
        ├── data-table-converters.ts  # Conversão de DataTable → objetos
        ├── parser.ts             # Motor de resolução de referências
        └── setup.ts              # Hooks do Cucumber (BeforeAll/Before/After)
```

---

## Como executar

```bash
# Subir o banco de dados (Docker)
pnpm -F @agenda-app/server start:database

# Rodar todos os testes de integração
pnpm -F @agenda-app/server test:integration

# Rodar um feature específica
pnpm -F @agenda-app/server exec cucumber-js test/features/auth/sign-in.feature
```

---

## Padrão 1 — Banco de dados de teste isolado

### O problema
Testes de integração não podem tocar o banco de produção/desenvolvimento.

### A solução
O arquivo `test/support/setup.ts` redireciona `DATABASE_URL` para um banco separado
(`test_integration_agenda`) **antes** da aplicação NestJS ser inicializada.

```typescript
// setup.ts — executado antes de qualquer cenário
const TEST_DATABASE_URL =
  `postgresql://postgres:postgres@localhost:5432/test_integration_agenda`;

BeforeAll(async function () {
    setupDatabaseUrl();                // DATABASE_URL → banco de teste
    execSync(`prisma migrate deploy`); // cria o banco + aplica migrations
    fs.writeFileSync(LOCK_FILE, '');   // sinaliza workers paralelos
});
```

### Variáveis de ambiente relevantes
As variáveis lidas do `.env` de desenvolvimento continuam funcionando.
Apenas `DATABASE_URL` é sobrescrita dinamicamente no momento do teste.

| Variável | Valor em testes |
|----------|----------------|
| `DATABASE_URL` | `postgresql://…/test_integration_agenda` |
| `NODE_ENV` | `test` |
| `STORAGE_TYPE` | `local` |
| `LOCAL_UPLOAD_DIR` | `./test-files` |
| `MQTT_BROKER_URL` | _não definida_ (MQTT desabilitado) |

---

## Padrão 2 — App NestJS por cenário

### O problema
Cada cenário deve rodar com estado limpo: sem cache de sessão, sem providers
corrompidos por testes anteriores.

### A solução
`test/support/context.ts` cria uma instância **nova** de `NestExpressApplication`
para cada cenário via `@nestjs/testing`.

```typescript
// context.ts
public async start(): Promise<void> {
    const moduleRef = await Test.createTestingModule({
        imports: [AppModule], // app completo
    })
        .overrideProvider(Logger)
        .useClass(ConsoleErrorLogger) // suprime logs de info/debug nos testes
        .compile();

    this.app = moduleRef.createNestApplication<NestExpressApplication>();
    setupApp(this.app); // registra prefix api/, versioning v1, cookies, CORS…
    await this.app.init();
}

public async stop(): Promise<void> {
    await this.prisma.$disconnect();
    await this.app.close();
}
```

### Providers sobrescritos

| Provider | Substituto | Motivo |
|----------|-----------|--------|
| `Logger` | `ConsoleErrorLogger` | Silencia logs de info/debug durante testes |

> Os providers de IA (`MockChatProvider`, `MockEmbeddingProvider`) já são os padrão
> quando `AI_CHAT_PROVIDER` e `AI_EMBEDDING_PROVIDER` não estão definidos.
> O MQTT ignora graciosamente a ausência de `MQTT_BROKER_URL`.

---

## Padrão 3 — Isolamento de dados com `contextId`

### O problema
Testes rodados em paralelo podem criar registros com os mesmos usernames/emails,
causando conflitos de unicidade no banco.

### A solução
Cada instância de `Context` recebe um `contextId` aleatório de 8 caracteres.
Todos os valores que precisam ser únicos (username, email) recebem esse sufixo.

```typescript
// context.ts
contextId: randomBytes(4).toString('hex'), // ex: "a1b2c3d4"

public getUniqueValue(value: string): string {
    return `${value}_${this.variables.contextId}`;
}
```

```typescript
// user.ts (step definition)
const uniqueUsername = this.getUniqueValue(username);
// "john_doe" → "john_doe_a1b2c3d4"
```

**Os dados NÃO são apagados entre cenários.** A unicidade via `contextId`
garante que cenários paralelos não conflitem.

---

## Padrão 4 — Sistema de referências `${ref:...}`

### O problema
IDs de entidades criadas em um step precisam ser referenciados em steps posteriores,
mas são gerados dinamicamente (UUIDs).

### A solução
O arquivo `test/support/parser.ts` implementa um motor de resolução de referências.

#### Sintaxe suportada

| Expressão | Resolve para |
|-----------|-------------|
| `${ref:id:user:john_doe}` | UUID do usuário com chave `john_doe` |
| `${ref:id:clinic:primary}` | UUID da clínica com chave `primary` |
| `${ref:id:clinicMember:dr_house}` | UUID do membro com chave `dr_house` |
| `${ref:id:professional:dr_house}` | UUID do profissional com chave `dr_house` (extensão 1:1 do membro) |
| `${ref:var:contextId}` | Valor do `contextId` do cenário atual |

#### Exemplo de uso em feature

```gherkin
When I send a "GET" request to "/api/v1/user/${ref:id:user:john_doe}"
Then the response should match:
  """JSON
  {
    "id": "${ref:id:user:john_doe}",
    "username": "john_doe_${ref:var:contextId}"
  }
  """
```

#### Como registrar um ID

```typescript
// em qualquer step definition
this.setVariableId('user', 'john_doe', response.body.id);
// depois acessível como ${ref:id:user:john_doe}
```

---

## Padrão 5 — Agente HTTP persistente (sessão de cookies)

### O problema
O fluxo de autenticação usa cookies. Múltiplas requisições em um cenário precisam
compartilhar o mesmo jar de cookies.

### A solução
`context.ts` expõe um `supertest.agent` que persiste cookies entre requisições.

```typescript
public get agent(): supertest.Agent {
    this.superagent ??= supertest.agent(this.app.getHttpServer());
    return this.superagent;
}

public clearAgent(): void {
    this.superagent = undefined; // descarta cookies (sign-out implícito)
}
```

O `clearAgent()` é chamado antes de um novo sign-in para garantir que a sessão
anterior não interfira.

---

## Padrão 6 — Steps de HTTP reutilizáveis

### Requisições com corpo (DataTable vertical)

```gherkin
When I send a "POST" request to "/api/v1/auth/sign-in" with:
  | username | john_doe_${ref:var:contextId} |
  | password | J0hn.Do3!                     |
```

### Requisições com query string

```gherkin
When I send a "GET" request to "/api/v1/appointments" with the query:
  | page | 1  |
  | size | 10 |
```

### Requisições sem corpo

```gherkin
When I send a "DELETE" request to "/api/v1/user/${ref:id:user:john_doe}"
```

### Asserções

```gherkin
Then the request should succeed with a 200 status code
Then the request should fail with a 400 status code
Then the response should match:
  """JSON
  { "id": "${ref:id:user:john_doe}" }
  """
Then the response should contain:
  | username | john_doe |
Then I save the response field "id" as "user" id for "john_doe"
```

---

## Padrão 7 — Steps de usuário e autenticação

```gherkin
# Cria usuários em massa
Given the following users exist:
  | Name     | Username | Email            | Password  |
  | John Doe | john_doe | john@example.com | J0hn.Do3! |

# Cria um usuário simples
Given a user "john_doe" exists with password "J0hn.Do3!"

# Autentica
Given I am signed in as "john_doe"
Given I am signed in as "john_doe" with clinic member "${ref:id:clinicMember:dr_house}"

# Verifica sessão
Then I should be signed in as "john_doe"
Then I should be signed out
```

---

## Padrão 8 — Paralelismo com sincronização via lock file

O Cucumber roda features em paralelo (via `parallel` em `cucumber.mjs`).
Apenas o worker 0 executa as migrations; os demais aguardam o lock file:

```typescript
BeforeAll(async function () {
    const workerId = process.env.CUCUMBER_WORKER_ID;

    if (workerId === undefined || workerId === '0') {
        execSync(`prisma migrate deploy`);
        fs.writeFileSync(LOCK_FILE, '');   // sinaliza pronto
    } else {
        while (!fs.existsSync(LOCK_FILE)) {
            await sleep(1000);             // aguarda worker 0
        }
    }
});
```

---

## Padrão 9 — Acesso direto ao Prisma para asserções de estado

Para verificar efeitos colaterais no banco (sem expor via API), use `this.prisma`:

```typescript
// Em qualquer step definition
const user = await this.prisma.user.findUnique({
    where: {id: this.getVariableId('user', 'john_doe')},
});
chai.expect(user?.deletedAt).to.not.be.null;
```

---

## Padrão 10 — Conversão de DataTable

### Tabela vertical (singleEntry) → objeto

```gherkin
| name     | John Doe  |
| username | john_doe  |
| password | J0hn.Do3! |
```

```typescript
import {singleEntry} from '../support/data-table-converters';
const body = singleEntry(this, table);
// → { name: 'John Doe', username: 'john_doe', password: 'J0hn.Do3!' }
```

### Tabela horizontal (multipleEntries) → array de objetos

```gherkin
| Name     | Username | Password   |
| John Doe | john_doe | J0hn.Do3!  |
| Jane Doe | jane_doe | J@n3.Do3!  |
```

```typescript
import {multipleEntries} from '../support/data-table-converters';
const rows = multipleEntries(this, table);
// → [{ Name: 'John Doe', Username: 'john_doe', ... }, ...]
```

### Tipos suportados nos valores das células

| Valor na célula | Tipo JS |
|-----------------|---------|
| `null` | `null` |
| `true` / `false` | `boolean` |
| `42` / `3.14` | `number` |
| `["a","b"]` | `Array` |
| `{"key":"val"}` | `object` |
| qualquer outro | `string` |
| `${ref:...}` | resolvido antes da conversão |

---

## Adicionando novos step definitions

1. Crie o arquivo em `test/step-definitions/<domínio>.ts`
2. Importe `Context` de `../support/context`
3. Use `this` tipado como `Context` nos callbacks
4. Registre IDs com `this.setVariableId(idType, key, id)`
5. Resolva referências com `resolveReferences(this, value)` do `../support/parser`
6. Adicione o domínio ao tipo `VariableIdType` em `test/support/context.ts` se necessário

---

## Adicionando novas features

1. Crie o arquivo em `test/features/<domínio>/<nome>.feature`
2. Use o `Background` para setup compartilhado entre cenários
3. Use `contextId` via `${ref:var:contextId}` para dados únicos
4. Referencie IDs criados com `${ref:id:<tipo>:<chave>}`
5. Mantenha cada `Scenario` focado em um único comportamento

---

## Referências

- [Cucumber.js docs](https://github.com/cucumber/cucumber-js/blob/main/docs/support_files/world.md)
- [supertest](https://github.com/ladjs/supertest)
- [chai-match-pattern](https://github.com/cbusillo/chai-match-pattern)
- [chai-subset](https://github.com/debitoor/chai-subset)
- [sinon.js](https://sinonjs.org/)
