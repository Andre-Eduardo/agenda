/**
 * Fuso horário usado para interpretar a agenda (horário de atendimento, dia da semana).
 *
 * O servidor guarda instantes em UTC, mas o horário de atendimento (`WorkingHours`) é
 * cadastrado em hora local da clínica (HH:mm). Enquanto não houver fuso por clínica,
 * todas as clínicas usam o horário de Brasília.
 */
export const DEFAULT_CLINIC_TIME_ZONE = 'America/Sao_Paulo';

export type ZonedDateParts = {
    /** Data local no formato YYYY-MM-DD. */
    date: string;
    /** Dia da semana local, 0 (domingo) a 6 (sábado), como `Date#getDay`. */
    dayOfWeek: number;
    /** Hora local no formato HH:mm (24h). */
    time: string;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatters = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
    let formatter = formatters.get(timeZone);

    if (formatter === undefined) {
        formatter = new Intl.DateTimeFormat('en-US', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            weekday: 'short',
            hourCycle: 'h23',
        });
        formatters.set(timeZone, formatter);
    }

    return formatter;
}

/**
 * Decompõe um instante na data, dia da semana e hora de parede do fuso informado,
 * independentemente do fuso do processo (TZ) em que o servidor roda.
 */
export function toZonedParts(instant: Date, timeZone: string = DEFAULT_CLINIC_TIME_ZONE): ZonedDateParts {
    const parts: Record<string, string> = {};

    for (const part of getFormatter(timeZone).formatToParts(instant)) {
        parts[part.type] = part.value;
    }

    return {
        date: `${parts.year}-${parts.month}-${parts.day}`,
        dayOfWeek: WEEKDAYS.indexOf(parts.weekday),
        time: `${parts.hour}:${parts.minute}`,
    };
}
