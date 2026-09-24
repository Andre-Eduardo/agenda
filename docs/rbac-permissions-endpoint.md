# Permissões da sessão clínica (L0-03)

`GET /api/v1/clinic-members/me/permissions` exige autenticação e um membro de
clínica selecionado na sessão. A resposta é um objeto com `permissions`, uma
lista ordenada de identificadores como `patient:view`. Exemplo de formato
(lista abreviada):

```json
{"permissions": ["patient:view", "user:change-password", "user:view-profile"]}
```

O servidor consulta o vínculo atual e recusa com 403 um membro inexistente,
inativo, de outro usuário ou de outra clínica. As permissões vêm do mesmo
`MultiAuthorizer` usado pelo guard HTTP: união das permissões globais do usuário
com o teto dos papéis do membro. Papéis múltiplos também são unidos. A matriz
dos cinco papéis está em [rbac-matrix.md](rbac-matrix.md).

Esses identificadores descrevem capacidades no contexto da clínica. Acesso a
um paciente, documento ou agenda específica ainda depende das verificações
granulares dos respectivos endpoints. O client gerado disponibiliza
`getCurrentClinicMemberPermissions` e `useGetCurrentClinicMemberPermissions`.

## Consumo no frontend (L0-04)

`useCan` e `<Can>` (`apps/web/src/hooks/useCan.tsx`) leem essa lista com
`useGetCurrentClinicMemberPermissions`, em cache por 5 minutos e só quando há uma
restrição a avaliar. A UI nega por padrão: enquanto a lista carrega, ou se a
consulta falha sem nada em cache, a ação não é exibida nem acionável. Esse
controle apenas molda a interface; o servidor continua sendo a autoridade e
responde 403 a uma ação proibida. Detalhes de uso em
[frontend/03-auth.md](frontend/03-auth.md#usecan-hook).
