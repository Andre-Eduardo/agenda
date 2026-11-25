# Painel operacional de recepção

A rota `/reception` apresenta os agendamentos do dia local em quatro etapas: aguardando chegada, na recepção, em atendimento e finalizados. A tela atualiza os dados a cada minuto, ao voltar para a aba e pelo botão **Atualizar**. O dia muda em até um minuto após a meia-noite local.

Cada linha mostra horário, paciente, estado e as ações válidas para aquele estado. **Registrar chegada** leva `SCHEDULED` ou `CONFIRMED` a `ARRIVED`. **Chamar paciente** leva `ARRIVED` a `IN_PROGRESS`. **Marcar falta** leva `SCHEDULED` ou `CONFIRMED` a `NO_SHOW` após confirmação. **Abrir paciente** navega para o perfil do paciente.

**Concluir atendimento** está disponível na recepção e nos detalhes do agendamento para quem tem `appointment:update` e acesso ao atendimento. A ação leva `IN_PROGRESS` a `COMPLETED`, move a consulta para **Finalizados** na recepção e grava o responsável e horário na trilha de estados. O fluxo atual permite encerrar uma consulta mesmo quando a assinatura da evolução ou o pagamento estão pendentes. A evolução e o pagamento seguem seus fluxos próprios.

O painel usa os endpoints gerados de agendamento e paciente. A navegação e a consulta exigem `appointment:view`; cada ação é exibida apenas com sua permissão (`appointment:checkin`, `appointment:call` ou `appointment:update`), e o acesso ao perfil exige `patient:view`. O servidor continua validando a clínica, o acesso ao paciente e a [máquina de estados](./appointment-status-machine.md).

A busca usa o intervalo entre 00:00 e 23:59:59,999 no fuso local do navegador e retorna até 500 consultas. Se houver mais, a tela avisa que a lista está limitada. Falhas de consulta mostram uma opção de tentar novamente; falhas nas ações mostram uma mensagem e recarregam os estados.
