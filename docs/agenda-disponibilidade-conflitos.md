# Disponibilidade e conflitos na agenda

O calendário mostra faixas de **fora do expediente** quando existe um horário de trabalho cadastrado para o dia e faixas de **bloqueio** com o motivo registrado. Sem horário cadastrado para o dia, a grade não indica indisponibilidade: o servidor também não emite o aviso de expediente nessa situação. As faixas são informativas; o servidor valida novamente o intervalo ao salvar.

Ao criar, editar, arrastar ou redimensionar uma consulta:

- `appointment.outside_working_hours` e `appointment.member_block` são avisos de disponibilidade. A pessoa pode confirmar expressamente a operação; a segunda tentativa envia `confirmOutsideAvailability: true`.
- `appointment.member_conflict` significa que o profissional já tem outra consulta ativa no intervalo. A operação é recusada mesmo após confirmar disponibilidade. É necessário escolher outro horário ou profissional.
- `appointment.room_conflict` significa que a sala já está ocupada. A operação é recusada; é necessário escolher outra sala ou horário.

As verificações de conflito com consultas são feitas após o bloqueio transacional da agenda no servidor. O cliente não usa a representação visual como autorização para salvar. O campo `confirmOutsideAvailability` só permite a exceção explícita para expediente e bloqueio do profissional; não libera sobreposição de consultas nem de salas.

Cobertura: testes unitários dos serviços de criação e atualização verificam que conflito de profissional não persiste mesmo com a confirmação. Os testes Playwright verificam a faixa com motivo, o aviso confirmável e a recusa da consulta sobreposta com mensagem legível.
