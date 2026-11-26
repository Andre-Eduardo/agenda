/** Mirrors the server limits (REMINDER_CONFIG_LIMITS) so the form can explain errors before saving. */
export const REMINDER_LIMITS = {
    maxLeadTimes: 3,
    minHoursBefore: 1,
    maxHoursBefore: 168,
    maxTemplateLength: 1000,
} as const;

export const REMINDER_VARIABLES = [
    {name: 'paciente', label: 'Paciente'},
    {name: 'data', label: 'Data'},
    {name: 'hora', label: 'Hora'},
    {name: 'profissional', label: 'Profissional'},
    {name: 'clinica', label: 'Clínica'},
] as const;

export type ReminderChannelOption = 'WHATSAPP' | 'EMAIL';

export type ReminderForm = {
    isActive: boolean;
    channels: ReminderChannelOption[];
    /** Raw input values, so the admin can clear a field while typing. */
    leadTimes: string[];
    messageTemplate: string;
};

export type ReminderFormErrors = Partial<Record<'channels' | 'leadTimes' | 'messageTemplate', string>>;

const PLACEHOLDER = /\{\{\s*([^{}]*?)\s*\}\}/g;
const KNOWN = new Set<string>(REMINDER_VARIABLES.map((variable) => variable.name));

export function unknownVariables(template: string): string[] {
    const unknown = new Set<string>();

    for (const [, name] of template.matchAll(PLACEHOLDER)) {
        if (name !== undefined && !KNOWN.has(name)) unknown.add(name);
    }

    return [...unknown];
}

/** Why the server would reject this text, or `null` when it is fine. */
export function templateProblem(template: string): string | null {
    if (template.length > REMINDER_LIMITS.maxTemplateLength) {
        return `O texto pode ter no máximo ${REMINDER_LIMITS.maxTemplateLength} caracteres.`;
    }

    const unknown = unknownVariables(template);

    return unknown.length > 0 ? `Variável desconhecida: ${unknown.map((name) => `{{${name}}}`).join(', ')}.` : null;
}

/** Whole hours from the inputs, unique and largest first; `null` when any input is not valid. */
export function parseLeadTimes(values: string[]): number[] | null {
    const hours: number[] = [];

    for (const value of values) {
        const trimmed = value.trim();

        if (!/^\d+$/.test(trimmed)) return null;

        const parsed = Number(trimmed);

        if (parsed < REMINDER_LIMITS.minHoursBefore || parsed > REMINDER_LIMITS.maxHoursBefore) return null;

        hours.push(parsed);
    }

    return [...new Set(hours)].toSorted((a, b) => b - a);
}

export function validateReminderForm(form: ReminderForm): ReminderFormErrors {
    const errors: ReminderFormErrors = {};

    if (form.channels.length === 0) {
        errors.channels = 'Escolha pelo menos um canal.';
    }

    if (form.leadTimes.length === 0) {
        errors.leadTimes = 'Defina pelo menos uma antecedência.';
    } else if (parseLeadTimes(form.leadTimes) === null) {
        errors.leadTimes = `Use horas inteiras entre ${REMINDER_LIMITS.minHoursBefore} e ${REMINDER_LIMITS.maxHoursBefore} (7 dias).`;
    }

    const problem = templateProblem(form.messageTemplate);

    if (problem !== null) {
        errors.messageTemplate = problem;
    }

    return errors;
}

/** "24 h antes (1 dia)", "2 h antes", "36 h antes (1 dia e 12 h)". */
export function describeLeadTime(hours: number): string {
    const days = Math.floor(hours / 24);
    const rest = hours % 24;

    if (days === 0) return `${hours} h antes`;

    const dayLabel = days === 1 ? '1 dia' : `${days} dias`;

    return rest === 0 ? `${hours} h antes (${dayLabel})` : `${hours} h antes (${dayLabel} e ${rest} h)`;
}

/** Inserts `{{name}}` at the cursor (or the end) and returns the new text and cursor position. */
export function insertVariable(
    template: string,
    name: string,
    selectionStart: number | null,
    selectionEnd: number | null
): {text: string; cursor: number} {
    const token = `{{${name}}}`;
    const start = selectionStart ?? template.length;
    const end = selectionEnd ?? start;
    const text = template.slice(0, start) + token + template.slice(end);

    return {text, cursor: start + token.length};
}
