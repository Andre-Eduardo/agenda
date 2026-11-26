-- L2-03: texto do lembrete configurável por clínica. NULL = texto padrão do domínio,
-- então as configurações existentes continuam enviando a mesma mensagem.

ALTER TABLE "clinic_reminder_config" ADD COLUMN "message_template" TEXT;
