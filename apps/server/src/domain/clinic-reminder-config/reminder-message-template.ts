import {ReminderChannel} from '@domain/appointment-reminder/entities';

/** Variables a clinic can use in its reminder text, written as `{{name}}`. */
export enum ReminderTemplateVariable {
    PATIENT = 'paciente',
    DATE = 'data',
    TIME = 'hora',
    PROFESSIONAL = 'profissional',
    CLINIC = 'clinica',
}

export type ReminderTemplateValues = Record<ReminderTemplateVariable, string>;

export const DEFAULT_REMINDER_MESSAGE_TEMPLATE =
    'Olá, {{paciente}}! Lembramos que você tem uma consulta agendada para {{data}} às {{hora}} com ' +
    '{{profissional}}. Em caso de imprevisto, entre em contato com {{clinica}}.';

export const REMINDER_SUBJECT = 'Lembrete de consulta';

/** Limits on what a clinic admin can configure (L2-03). */
export const REMINDER_CONFIG_LIMITS = {
    /** Channels that have a real provider; SMS has none yet (docs/notification-providers.md). */
    supportedChannels: [ReminderChannel.WHATSAPP, ReminderChannel.EMAIL] as readonly ReminderChannel[],
    maxLeadTimes: 3,
    minHoursBefore: 1,
    /** One week. */
    maxHoursBefore: 168,
    maxTemplateLength: 1000,
} as const;

const PLACEHOLDER = /\{\{\s*([^{}]*?)\s*\}\}/g;

const KNOWN_VARIABLES = new Set<string>(Object.values(ReminderTemplateVariable));

/** Placeholders in the template that are not one of {@link ReminderTemplateVariable}. */
export function findUnknownReminderVariables(template: string): string[] {
    const unknown = new Set<string>();

    for (const [, name] of template.matchAll(PLACEHOLDER)) {
        if (name !== undefined && !KNOWN_VARIABLES.has(name)) {
            unknown.add(name);
        }
    }

    return [...unknown];
}

export function renderReminderMessage(template: string, values: ReminderTemplateValues): string {
    const byName = new Map<string, string>(Object.entries(values));

    return template.replaceAll(PLACEHOLDER, (match, name: string) => byName.get(name) ?? match);
}

/** Appointments are shown in Brasília time until clinics get their own time zone. */
const REMINDER_TIME_ZONE = 'America/Sao_Paulo';

export function formatReminderDate(date: Date): string {
    return date.toLocaleDateString('pt-BR', {timeZone: REMINDER_TIME_ZONE});
}

export function formatReminderTime(date: Date): string {
    return date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit', timeZone: REMINDER_TIME_ZONE});
}
