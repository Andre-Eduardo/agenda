-- Lease de envio dos lembretes: impede que duas instâncias da API enviem o mesmo lembrete.
ALTER TABLE "appointment_reminder" ADD COLUMN "claimed_until" TIMESTAMP(3);
