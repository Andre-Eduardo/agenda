# Painel operacional de recepção

A rota `/reception` apresenta os agendamentos do dia local em quatro etapas: aguardando chegada, na recepção, em atendimento e finalizados. A tela atualiza os dados a cada minuto, ao voltar para a aba e pelo botão **Atualizar**. O dia muda em até um minuto após a meia-noite local.

Cada linha mostra horário, paciente, profissional responsável, tipo da consulta, estado e as ações válidas para aquele estado. **Registrar chegada** leva `SCHEDULED` ou `CONFIRMED` a `ARRIVED`. **Chamar paciente** leva `ARRIVED` a `IN_PROGRESS` nas clínicas que ainda não publicaram o painel. **Marcar falta** leva `SCHEDULED` ou `CONFIRMED` a `NO_SHOW` após confirmação. **Abrir paciente** navega para o perfil do paciente.

**Concluir atendimento** está disponível na recepção e nos detalhes do agendamento para quem tem `appointment:update` e acesso ao atendimento. A ação leva `IN_PROGRESS` a `COMPLETED`, move a consulta para **Finalizados** na recepção e grava o responsável e horário na trilha de estados. O fluxo atual permite encerrar uma consulta mesmo quando a assinatura da evolução ou o pagamento estão pendentes. A evolução e o pagamento seguem seus fluxos próprios.

## Fila de chamadas e TV

Em **Recepção → Configurar painel de chamada**, um gestor pode ajustar título, mensagem, cores, uso do logotipo da clínica, som e duração. A prévia exibe a senha de exemplo **A-042**. O primeiro **Publicar painel** habilita a fila. Abra na TV o link copiado na configuração. Ao gerar um novo link ou revogar o atual, as TVs que usavam o endereço anterior perdem acesso. A fila continua disponível na recepção.

Em clínicas com a fila habilitada, **Registrar chegada** cria a senha para a equipe informar ao paciente. **Obter senha** recupera a senha ativa ou registra na fila uma chegada anterior à publicação do painel. A equipe pode chamar em ordem de chegada, informar o número da sala ou do guichê, repetir a chamada para o mesmo destino ou retirar o paciente com motivo. **Iniciar atendimento** confirma a entrada efetiva em atendimento e encerra a senha. O cancelamento também fecha entradas pendentes. A conclusão segue o fluxo da agenda.

O painel exibe uma chamada de cada vez, pelo tempo configurado, na ordem em que o servidor registrou os anúncios. A TV consulta o servidor a cada dois segundos e descarta chamadas vencidas. Quando o som estiver habilitado na configuração, selecione **Ativar som** na TV. Para manter o painel na tela, use a opção de tela cheia do navegador.

A operação da fila exige `patient-call:operate`. A configuração exige `patient-call:configure` e o início do atendimento com a fila habilitada exige `appointment:start`. O check-in continua exigindo `appointment:checkin`. [Matriz de permissões](./rbac-matrix.md)

## Consultas e permissões da agenda

A recepção usa os endpoints gerados de agendamento, paciente e fila. A navegação e a consulta exigem `appointment:view`; cada ação é exibida apenas com sua permissão (`appointment:checkin`, `appointment:call` ou `appointment:update`), e o acesso ao perfil exige `patient:view`. O servidor continua validando a clínica, o acesso ao paciente e a [máquina de estados](./appointment-status-machine.md).

A busca usa o intervalo entre 00:00 e 23:59:59,999 no fuso local do navegador e retorna até 500 consultas. Se houver mais, a tela avisa que a lista está limitada. Falhas de consulta mostram uma opção de tentar novamente; falhas nas ações mostram uma mensagem e recarregam os estados.
