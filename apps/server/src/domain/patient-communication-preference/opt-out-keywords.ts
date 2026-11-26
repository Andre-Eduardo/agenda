/**
 * Replies that mean "stop sending me reminders". Only whole-message matches count, so a
 * sentence that merely contains one of the words ("não posso sair do trabalho") is not an opt-out.
 * "CANCELAR" is left out on purpose: patients use it to cancel the appointment, not the reminders.
 */
const OPT_OUT_KEYWORDS = new Set(['sair', 'parar', 'pare', 'stop', 'descadastrar', 'nao quero receber']);

/** Text appended to WhatsApp reminders so the patient knows how to opt out. */
export const WHATSAPP_OPT_OUT_FOOTER = 'Para não receber mais lembretes por WhatsApp, responda SAIR.';

export function isOptOutReply(text: string | null): boolean {
    if (text === null) return false;

    const normalized = text
        .normalize('NFD')
        .replaceAll(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replaceAll(/[^a-z\s]/g, ' ')
        .replaceAll(/\s+/g, ' ')
        .trim();

    return OPT_OUT_KEYWORDS.has(normalized);
}
