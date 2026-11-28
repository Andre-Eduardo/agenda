import type {ApiProblem, Appointment, AppointmentStatus, AppointmentType, Patient} from '@agenda-app/client';
import {AxiosError} from '@agenda-app/client';
import {translateApiError} from '@/utils/translate-api-error';

/**
 * Helpers shared by the appointment screens (calendar and table): labels, date helpers and the
 * view model built from the API appointment.
 */

// ── i18n constants ────────────────────────────────────────────────
export const MONTH_NAMES = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
];
export const WEEKDAYS_LONG = [
    'domingo',
    'segunda-feira',
    'terça-feira',
    'quarta-feira',
    'quinta-feira',
    'sexta-feira',
    'sábado',
];
export const WEEKDAYS_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

// ── Labels ────────────────────────────────────────────────────────
export const STATUS_LABELS: Record<AppointmentStatus, string> = {
    SCHEDULED: 'Agendado',
    CONFIRMED: 'Confirmado',
    COMPLETED: 'Concluído',
    CANCELLED: 'Cancelado',
    NO_SHOW: 'Faltou',
    ARRIVED: 'Chegou',
    IN_PROGRESS: 'Em atendimento',
};

export const TYPE_LABELS: Record<AppointmentType, string> = {
    FIRST_VISIT: 'Primeira consulta',
    RETURN: 'Retorno',
    WALK_IN: 'Urgência',
    TELEMEDICINE: 'Teleconsulta',
    PROCEDURE: 'Procedimento',
};

export const ALL_STATUSES = Object.keys(STATUS_LABELS) as AppointmentStatus[];
export const DURATIONS = [15, 30, 45, 60, 90, 120];

export const AVAILABILITY_WARNING_MESSAGES: Record<string, string> = {
    'appointment.outside_working_hours':
        'Este horário está fora do expediente cadastrado do profissional. Deseja agendar mesmo assim?',
    'appointment.member_block':
        'O profissional tem um bloqueio de agenda cadastrado nesse período. Deseja agendar mesmo assim?',
};

/** Detecta o aviso confirmável de disponibilidade (409) vindo do backend, sem tratá-lo como erro fatal. */
export function getAvailabilityWarning(error: unknown): string | null {
    if (!(error instanceof AxiosError)) return null;

    const detail = (error.response?.data as ApiProblem | undefined)?.detail;

    return detail ? (AVAILABILITY_WARNING_MESSAGES[detail] ?? null) : null;
}

export function getApiErrorDetail(error: unknown): string | null {
    if (!(error instanceof AxiosError)) return null;

    const detail = (error.response?.data as ApiProblem | undefined)?.detail;

    return detail ? translateApiError(detail, detail) : null;
}

// ── Internal view model ───────────────────────────────────────────
export interface ApptView {
    id: string;
    patientId: string;
    attendedByMemberId: string;
    clinicId: string;
    date: string; // YYYY-MM-DD
    start: string; // HH:mm
    end: string; // HH:mm
    type: AppointmentType;
    status: AppointmentStatus;
    note: string | null;
    roomId: string | null;
    raw: Appointment;
}

// ── Paginated response shape ───────────────────────────────────────
export interface PaginatedPage<T> {
    data: T[];
    totalCount: number;
}

export interface NewAppointmentPrefill {
    date: string;
    start: string;
    roomId?: string | null;
    attendedByMemberId?: string;
}

// ── Date helpers ──────────────────────────────────────────────────
export function startOfWeek(d: Date): Date {
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const r = new Date(d);

    r.setDate(d.getDate() + diff);
    r.setHours(0, 0, 0, 0);

    return r;
}

export function addDays(d: Date, n: number): Date {
    const r = new Date(d);

    r.setDate(d.getDate() + n);

    return r;
}

export function endOfDay(d: Date): Date {
    const result = new Date(d);

    result.setHours(23, 59, 59, 999);

    return result;
}

export function fmtDate(d: Date): string {
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

export function parseCalendarDate(value: string | undefined): Date | null {
    if (!value) return null;

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return fmtDate(date) === value ? date : null;
}

export function sameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function timeToMin(t: string): number {
    const [h, m] = t.split(':').map(Number);

    return h * 60 + m;
}

export function minToTime(min: number): string {
    return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

/** Extract YYYY-MM-DD from an ISO datetime string, adjusting to local time */
export function isoToLocalDate(iso: string): string {
    const d = new Date(iso);

    return fmtDate(d);
}

/** Extract HH:mm from an ISO datetime string in local time */
export function isoToLocalTime(iso: string): string {
    const d = new Date(iso);

    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Build ISO datetime from local date (YYYY-MM-DD) + time (HH:mm) */
export function localDateTimeToISO(date: string, time: string): string {
    return new Date(`${date}T${time}:00`).toISOString();
}

/**
 * Orval generates nullable string fields from Prisma as `{ [key: string]: unknown } | null`.
 * At runtime they are plain strings. This helper extracts the string value safely.
 */
export function asStr(val: unknown): string | null {
    if (val == null) return null;

    if (typeof val === 'string') return val || null;

    return null;
}

/** AppointmentNote is typed as JSON by Orval, but is actually a string value */
export function noteToString(note: Appointment['note']): string | null {
    return asStr(note);
}

export function toApptView(a: Appointment): ApptView {
    return {
        id: a.id,
        patientId: a.patientId,
        attendedByMemberId: a.attendedByMemberId,
        clinicId: a.clinicId,
        date: isoToLocalDate(a.startAt),
        start: isoToLocalTime(a.startAt),
        end: isoToLocalTime(a.endAt),
        type: a.type,
        status: a.status,
        note: noteToString(a.note),
        roomId: a.roomId,
        raw: a,
    };
}

// ── Patient helper ────────────────────────────────────────────────
export function getInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();
}

export function getPatientName(patients: Patient[], id: string): string {
    return patients.find((p) => p.id === id)?.name ?? '—';
}
