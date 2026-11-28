import {AppointmentStatus, AppointmentType} from '@domain/appointment/entities';

/** One appointment as the report reads it. */
export type AppointmentReportRow = {
    status: AppointmentStatus;
    type: AppointmentType;
    startAt: Date;
    durationMinutes: number;
    attendedByMemberId: string;
    professionalName: string;
    patientId: string;
    procedureName: string | null;
    arrivedAt: Date | null;
    calledAt: Date | null;
};

export type AppointmentReportOutcome = {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    /** Still open: scheduled, confirmed, arrived or in progress. */
    pending: number;
};

export type AppointmentReportSummary = AppointmentReportOutcome & {
    /** completed / (completed + no-show); null when no appointment reached an outcome. */
    attendanceRate: number | null;
    /** no-show / (completed + no-show); null when no appointment reached an outcome. */
    noShowRate: number | null;
    /** cancelled / total; null when there is no appointment. */
    cancellationRate: number | null;
    uniquePatients: number;
    /** Patients whose first appointment in the clinic falls in the period. */
    newPatients: number;
    /** Average minutes between check-in and call, over appointments that have both. */
    avgWaitMinutes: number | null;
    /** Booked minutes, cancelled appointments excluded. */
    bookedMinutes: number;
};

export type AppointmentReportByProfessional = AppointmentReportOutcome & {
    memberId: string;
    displayName: string;
    attendanceRate: number | null;
    uniquePatients: number;
};

export type AppointmentReportByDay = AppointmentReportOutcome & {date: string};

export type AppointmentReport = {
    period: {startDate: string; endDate: string; timeZone: string};
    filters: {professionalMemberId?: string};
    summary: AppointmentReportSummary;
    byStatus: Array<{status: AppointmentStatus; count: number}>;
    byType: Array<{type: AppointmentType; count: number}>;
    byProfessional: AppointmentReportByProfessional[];
    byProcedure: Array<{procedureName: string | null; count: number; completed: number}>;
    byDay: AppointmentReportByDay[];
    /** 0 = Sunday … 6 = Saturday, in the report time zone. Cancelled appointments excluded. */
    byWeekday: Array<{weekday: number; count: number}>;
    /** 0 … 23, in the report time zone. Cancelled appointments excluded. */
    byHour: Array<{hour: number; count: number}>;
};

export type AppointmentReportInput = {
    startDate: Date;
    endDate: Date;
    timeZone: string;
    professionalMemberId?: string;
    rows: AppointmentReportRow[];
    /** First (non-deleted) appointment start of each patient in the clinic, across all time. */
    firstAppointmentByPatient: Map<string, Date>;
};

const OPEN_STATUSES: ReadonlySet<AppointmentStatus> = new Set([
    AppointmentStatus.SCHEDULED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.ARRIVED,
    AppointmentStatus.IN_PROGRESS,
]);

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function emptyOutcome(): AppointmentReportOutcome {
    return {total: 0, completed: 0, cancelled: 0, noShow: 0, pending: 0};
}

function addOutcome(outcome: AppointmentReportOutcome, status: AppointmentStatus): AppointmentReportOutcome {
    return {
        total: outcome.total + 1,
        completed: outcome.completed + (status === AppointmentStatus.COMPLETED ? 1 : 0),
        cancelled: outcome.cancelled + (status === AppointmentStatus.CANCELLED ? 1 : 0),
        noShow: outcome.noShow + (status === AppointmentStatus.NO_SHOW ? 1 : 0),
        pending: outcome.pending + (OPEN_STATUSES.has(status) ? 1 : 0),
    };
}

function ratio(part: number, whole: number): number | null {
    return whole > 0 ? Math.round((part / whole) * 10_000) / 10_000 : null;
}

function attendanceRate({completed, noShow}: AppointmentReportOutcome): number | null {
    return ratio(completed, completed + noShow);
}

/** Whether `timeZone` is an IANA zone this runtime knows. */
export function isValidTimeZone(timeZone: string): boolean {
    try {
        return new Intl.DateTimeFormat('en-US', {timeZone}).resolvedOptions().timeZone.length > 0;
    } catch {
        return false;
    }
}

/** Splits an instant into the calendar parts seen in `timeZone`. */
function zonedParts(formatter: Intl.DateTimeFormat, date: Date): {date: string; weekday: number; hour: number} {
    const parts = new Map(formatter.formatToParts(date).map((part) => [part.type, part.value]));
    const hour = Number(parts.get('hour')) % 24;

    return {
        date: `${parts.get('year')}-${parts.get('month')}-${parts.get('day')}`,
        weekday: WEEKDAYS.indexOf(parts.get('weekday') ?? ''),
        hour,
    };
}

/** Aggregates appointments into the clinic's operational report. Pure: no I/O. */
export function buildAppointmentReport(input: AppointmentReportInput): AppointmentReport {
    const {rows, timeZone, startDate, endDate, firstAppointmentByPatient} = input;
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
        hour: '2-digit',
        hourCycle: 'h23',
    });

    let summary = emptyOutcome();
    const patients = new Set<string>();
    const byStatus = new Map<AppointmentStatus, number>(Object.values(AppointmentStatus).map((s) => [s, 0]));
    const byType = new Map<AppointmentType, number>();
    const byProfessional = new Map<
        string,
        {displayName: string; outcome: AppointmentReportOutcome; patients: Set<string>}
    >();
    const byProcedure = new Map<string | null, {count: number; completed: number}>();
    const byDay = new Map<string, AppointmentReportOutcome>();
    const byWeekday = Array.from({length: 7}, () => 0);
    const byHour = Array.from({length: 24}, () => 0);
    let waitTotal = 0;
    let waitCount = 0;
    let bookedMinutes = 0;

    for (const row of rows) {
        summary = addOutcome(summary, row.status);
        patients.add(row.patientId);
        byStatus.set(row.status, (byStatus.get(row.status) ?? 0) + 1);
        byType.set(row.type, (byType.get(row.type) ?? 0) + 1);

        const professional = byProfessional.get(row.attendedByMemberId) ?? {
            displayName: row.professionalName,
            outcome: emptyOutcome(),
            patients: new Set<string>(),
        };

        professional.patients.add(row.patientId);
        byProfessional.set(row.attendedByMemberId, {
            ...professional,
            outcome: addOutcome(professional.outcome, row.status),
        });

        const procedure = byProcedure.get(row.procedureName) ?? {count: 0, completed: 0};

        byProcedure.set(row.procedureName, {
            count: procedure.count + 1,
            completed: procedure.completed + (row.status === AppointmentStatus.COMPLETED ? 1 : 0),
        });

        const zoned = zonedParts(formatter, row.startAt);

        byDay.set(zoned.date, addOutcome(byDay.get(zoned.date) ?? emptyOutcome(), row.status));

        if (row.status !== AppointmentStatus.CANCELLED) {
            bookedMinutes += row.durationMinutes;

            if (zoned.weekday >= 0) byWeekday[zoned.weekday] += 1;
            byHour[zoned.hour] += 1;
        }

        if (row.arrivedAt !== null && row.calledAt !== null && row.calledAt >= row.arrivedAt) {
            waitTotal += (row.calledAt.getTime() - row.arrivedAt.getTime()) / 60_000;
            waitCount += 1;
        }
    }

    let newPatients = 0;

    for (const patientId of patients) {
        const first = firstAppointmentByPatient.get(patientId);

        if (first !== undefined && first >= startDate && first <= endDate) newPatients += 1;
    }

    return {
        period: {startDate: startDate.toISOString(), endDate: endDate.toISOString(), timeZone},
        filters: {professionalMemberId: input.professionalMemberId},
        summary: {
            ...summary,
            attendanceRate: attendanceRate(summary),
            noShowRate: ratio(summary.noShow, summary.completed + summary.noShow),
            cancellationRate: ratio(summary.cancelled, summary.total),
            uniquePatients: patients.size,
            newPatients,
            avgWaitMinutes: waitCount > 0 ? Math.round((waitTotal / waitCount) * 10) / 10 : null,
            bookedMinutes,
        },
        byStatus: [...byStatus].map(([status, count]) => ({status, count})),
        byType: [...byType]
            .map(([type, count]) => ({type, count}))
            .toSorted((a, b) => b.count - a.count || a.type.localeCompare(b.type)),
        byProfessional: [...byProfessional]
            .map(([memberId, {displayName, outcome, patients: seen}]) => ({
                memberId,
                displayName,
                ...outcome,
                attendanceRate: attendanceRate(outcome),
                uniquePatients: seen.size,
            }))
            .toSorted((a, b) => b.total - a.total || a.displayName.localeCompare(b.displayName)),
        byProcedure: [...byProcedure]
            .map(([procedureName, {count, completed}]) => ({procedureName, count, completed}))
            .toSorted((a, b) => b.count - a.count || (a.procedureName ?? '').localeCompare(b.procedureName ?? '')),
        byDay: [...byDay]
            .map(([date, outcome]) => ({date, ...outcome}))
            .toSorted((a, b) => a.date.localeCompare(b.date)),
        byWeekday: byWeekday.map((count, weekday) => ({weekday, count})),
        byHour: byHour.map((count, hour) => ({hour, count})),
    };
}
