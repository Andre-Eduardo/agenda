# Gestão compartilhada de pacientes

Revisão do [cartão #49](https://trello.com/c/GOK7S7O2). O escopo abaixo distingue cadastro, agenda e evolução clínica. A [matriz RBAC](./rbac-matrix.md) lista as permissões funcionais por papel. As ações também verificam o vínculo do membro com a clínica e com o recurso.

## Fluxos atuais

| Ação | Regra em uso | Referência |
| --- | --- | --- |
| Buscar e abrir um paciente | Secretaria e profissional consultam o cadastro quando têm acesso básico ao paciente. Gestores consultam os pacientes da clínica ativa. | [Busca de pacientes](../apps/server/src/application/patient/services/search-patients.service.ts), [detalhe](../apps/server/src/application/patient/services/get-patient.service.ts) |
| Cadastrar | O cadastro é da clínica. A secretaria que cadastra recebe acesso `REGISTER_ONLY`. O profissional que cadastra recebe `FULL`. O acesso inicial é do membro que realizou o cadastro. | [Cadastro e acesso inicial](../apps/server/src/application/patient/services/create-patient.service.ts) |
| Editar dados cadastrais | A atualização exige `patient:update` e acesso de cadastro ao paciente. Para membros sem papel de gestão, `REGISTER_ONLY` ou `FULL` permitem editar. `READ_ONLY` permite consultar. | [Atualização de paciente](../apps/server/src/application/patient/services/update-patient.service.ts), [checagem do vínculo](../apps/server/src/application/clinic-patient-access/services/patient-access-checker.service.ts) |
| Agendar ou reagendar | O membro precisa da permissão da ação e do acesso ao paciente. Criar ou trocar o profissional do agendamento verifica também o escopo de gestão da agenda. | [Agendar](../apps/server/src/application/appointment/services/create-appointment.service.ts), [reagendar](../apps/server/src/application/appointment/services/update-appointment.service.ts), [acesso à agenda](../apps/server/src/application/professional-agenda-access/services/agenda-access-checker.service.ts) |
| Agendar retorno | O fluxo aberto pela evolução usa o paciente e o profissional responsável da evolução e exige acesso ao registro de origem. A secretaria pode criar a marcação operacional quando tem acesso ao paciente e à agenda. | [Retorno vinculado à evolução](../apps/server/src/application/appointment/services/appointment-follow-up.service.ts) |
| Conceder ou revogar vínculo | O gestor com `clinic-patient-access:manage` altera o acesso do membro ao paciente. A concessão valida a clínica e o membro ativo. A revogação aplica-se ao vínculo individual. | [Concessão e revogação](../apps/server/src/application/clinic-patient-access/services/index.ts) |
| Identificar duplicidades | O documento identifica um único cadastro por clínica. O mesmo documento pode constar em clínicas diferentes, cada uma com seu próprio cadastro. | [Restrição no banco](../apps/server/prisma/schema.prisma) |

A [lista de pacientes](../apps/web/src/views/modules/patients/pages/index/index.tsx) e o [seletor de agendamento](../apps/web/src/views/modules/appointments/pages/index/index.tsx) reutilizam a busca de pacientes da API. O [perfil do paciente](../apps/web/src/views/modules/patients/pages/detail/index.tsx) consulta a evolução em uma operação própria. A concessão e a revogação de vínculos existem na API e ainda precisam de um ponto de entrada para gestores no fluxo de pacientes.

## Matriz proposta para validar

| Perfil | Cadastro e agenda | Evolução clínica |
| --- | --- | --- |
| Secretaria | Vê e edita o cadastro com acesso cadastral. Agenda e acompanha o atendimento quando autorizada no paciente e na agenda. | Acesso operacional ao paciente permite acompanhar data, tipo e status. |
| Profissional vinculado | Vê o cadastro e os atendimentos dentro das suas permissões de paciente e agenda. | Lê as evoluções que criou com `record:view` e acesso clínico ao registro. |
| Segundo profissional do mesmo paciente | Pode ter acesso próprio ao cadastro e às suas consultas. A concessão é individual. | Lê as próprias evoluções. A autoria original permanece no histórico quando outro profissional assume o atendimento. |
| Gestor da clínica | Consulta a operação da clínica e administra vínculos conforme o papel. | Um gestor que também atua como profissional segue o escopo das suas próprias evoluções. |
| Superadmin | Opera conforme o contexto autenticado da clínica. | Pode consultar as evoluções na clínica ativa, conforme o [cartão #48](https://trello.com/c/HuFWmX1g). |
| Membro de outra clínica | Usa o cadastro e as consultas da própria clínica. | A API rejeita o acesso ao registro de outra clínica. |

O vínculo cadastral, a delegação da agenda e a regra de autoria têm finalidades diferentes. Exemplo para homologação: a secretaria cadastra o paciente e agenda com a Dra. Ana. Com o vínculo concedido, Ana abre o paciente e registra a evolução. Um retorno com o Dr. Bruno mantém o mesmo cadastro e ganha o próprio vínculo. A secretaria acompanha as duas consultas. O conteúdo de cada evolução fica no escopo do respectivo autor e do superadmin.

## Ajustes para implementação

| Frente | Decisão para Produto | Critério de aceite e regressão |
| --- | --- | --- |
| Encaminhar ao profissional | Definir se marcar a primeira consulta concede acesso operacional automaticamente ou se o gestor precisa conceder o vínculo. A criação do agendamento hoje verifica o acesso do ator, sem gravar um vínculo para o profissional escolhido. | Secretaria autorizada agenda com Ana. Ana vê o cadastro mínimo no momento definido e consegue iniciar o atendimento. Bruno, sem vínculo próprio, recebe acesso negado. |
| Apresentar os acessos à equipe | Definir quais papéis podem ver os vínculos e qual ação a interface deve oferecer quando falta acesso ao cadastro ou à agenda. | A equipe distingue o vínculo do paciente da delegação de agenda. Secretaria com `REGISTER_ONLY` pode atualizar cadastro e agendar dentro do escopo. |
| Trocar ou encerrar vínculo | Definir como transferir consultas futuras, quando encerrar o vínculo anterior e se o profissional conserva alguma visão operacional pós-transferência. Registrar quem fez a mudança e por quê. | Trocar Ana por Bruno em consulta futura preserva consultas passadas e autoria das evoluções. A revogação tira a visibilidade do cadastro e da agenda no escopo definido. Consulta de outra clínica é recusada. |
| Resolver duplicidade ou cadastro indisponível | Definir como orientar o usuário que tenta cadastrar um documento já utilizado na clínica e não pode abrir o paciente. Avaliar o tratamento de divergências cadastrais e registros desativados. | A mesma clínica possui um cadastro por documento. O retorno de conflito orienta o usuário a pedir acesso ou revisão e preserva a identidade do paciente para quem não tem permissão. |
| Revisar atalhos clínicos | Alinhar perfil clínico, alertas, permissões por documento, histórico e fluxos que agregam conteúdo clínico com a regra de autoria do #48. Decidir como tratar registros de autoria administrativa e concessões antigas. | A mesma política é verificada ao listar, abrir pelo ID e acessar atalhos. Um vínculo da secretaria permite acompanhamento, com conteúdo de evolução disponível ao autor autorizado ou ao superadmin. |

A matriz e as decisões de encaminhamento, revogação e duplicidade ficam para validação de Produto.
