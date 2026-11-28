import {
    buildAppointmentReport,
    isValidTimeZone,
    type AppointmentReportRow,
} from '@application/clinic-report/services/appointment-report.builder';
import {AppointmentStatus, AppointmentType} from '@domain/appointment/entities';

const startDate = new Date('2026-03-01T03:00:00.000Z');
const endDate = new Date('2026-04-01T02:59:59.999Z');

function row(overrides: Partial<AppointmentReportRow> = {}): AppointmentReportRow {
    return {
        status: AppointmentStatus.COMPLETED,
        type: AppointmentType.FIRST_VISIT,
        startAt: new Date('2026-03-10T12:00:00.000Z'),
        durationMinutes: 30,
        attendedByMemberId: 'member-a',
        professionalName: 'Dra. Ana',
        patientId: 'patient-1',
        procedureName: null,
        arrivedAt: null,
        calledAt: null,
        ...overrides,
    };
}

function build(rows: AppointmentReportRow[], firstAppointmentByPatient = new Map<string, Date>()) {
    return buildAppointmentReport({startDate, endDate, timeZone: 'America/Sao_Paulo', rows, firstAppointmentByPatient});
}

describe('buildAppointmentReport', () => {
    it('returns zeros and null rates for an empty period', () => {
        const report = build([]);

        expect(report.summary).toEqual({
            total: 0,
            completed: 0,
            cancelled: 0,
            noShow: 0,
            pending: 0,
            attendanceRate: null,
            noShowRate: null,
            cancellationRate: null,
            uniquePatients: 0,
            newPatients: 0,
            avgWaitMinutes: null,
            bookedMinutes: 0,
        });
        expect(report.byStatus).toHaveLength(Object.values(AppointmentStatus).length);
        expect(report.byWeekday).toHaveLength(7);
        expect(report.byHour).toHaveLength(24);
        expect(report.byDay).toEqual([]);
    });

    it('computes outcomes and rates over completed and no-show appointments', () => {
        const report = build([
            row(),
            row({patientId: 'patient-2'}),
            row({status: AppointmentStatus.COMPLETED, patientId: 'patient-3'}),
            row({status: AppointmentStatus.NO_SHOW, patientId: 'patient-4'}),
            row({status: AppointmentStatus.CANCELLED, patientId: 'patient-1'}),
            row({status: AppointmentStatus.SCHEDULED, patientId: 'patient-5'}),
            row({status: AppointmentStatus.CONFIRMED, patientId: 'patient-5'}),
        ]);

        expect(report.summary).toMatchObject({
            total: 7,
            completed: 3,
            noShow: 1,
            cancelled: 1,
            pending: 2,
            attendanceRate: 0.75,
            noShowRate: 0.25,
            cancellationRate: 0.1429,
            uniquePatients: 5,
            bookedMinutes: 180,
        });
    });

    it('groups per professional, sorted by volume', () => {
        const report = build([
            row({attendedByMemberId: 'member-b', professionalName: 'Dr. Bruno'}),
            row({attendedByMemberId: 'member-b', professionalName: 'Dr. Bruno', status: AppointmentStatus.NO_SHOW}),
            row({attendedByMemberId: 'member-a'}),
        ]);

        expect(report.byProfessional).toEqual([
            expect.objectContaining({memberId: 'member-b', total: 2, completed: 1, noShow: 1, attendanceRate: 0.5}),
            expect.objectContaining({memberId: 'member-a', total: 1, completed: 1, attendanceRate: 1}),
        ]);
    });

    it('buckets day, weekday and hour in the requested time zone', () => {
        // 01:30 UTC on Wednesday 11 March is 22:30 on Tuesday 10 March in São Paulo (UTC-3).
        const report = build([row({startAt: new Date('2026-03-11T01:30:00.000Z')})]);

        expect(report.byDay).toEqual([expect.objectContaining({date: '2026-03-10', total: 1})]);
        expect(report.byWeekday[2]).toEqual({weekday: 2, count: 1});
        expect(report.byHour[22]).toEqual({hour: 22, count: 1});
    });

    it('leaves cancelled appointments out of the weekday, hour and booked-minutes views', () => {
        const report = build([row({status: AppointmentStatus.CANCELLED})]);

        expect(report.byWeekday.every(({count}) => count === 0)).toBe(true);
        expect(report.byHour.every(({count}) => count === 0)).toBe(true);
        expect(report.summary.bookedMinutes).toBe(0);
        expect(report.byDay).toEqual([expect.objectContaining({cancelled: 1, total: 1})]);
    });

    it('counts as new only the patients whose first appointment is inside the period', () => {
        const report = build(
            [row({patientId: 'new'}), row({patientId: 'returning'}), row({patientId: 'unknown'})],
            new Map([
                ['new', new Date('2026-03-05T12:00:00.000Z')],
                ['returning', new Date('2025-11-05T12:00:00.000Z')],
            ])
        );

        expect(report.summary.newPatients).toBe(1);
    });

    it('averages the wait between check-in and call', () => {
        const report = build([
            row({arrivedAt: new Date('2026-03-10T12:00:00.000Z'), calledAt: new Date('2026-03-10T12:10:00.000Z')}),
            row({arrivedAt: new Date('2026-03-10T13:00:00.000Z'), calledAt: new Date('2026-03-10T13:25:00.000Z')}),
            row({arrivedAt: new Date('2026-03-10T14:00:00.000Z'), calledAt: null}),
        ]);

        expect(report.summary.avgWaitMinutes).toBe(17.5);
    });

    it('groups procedures, with appointments without procedure as null', () => {
        const report = build([
            row({procedureName: 'Limpeza'}),
            row({procedureName: 'Limpeza', status: AppointmentStatus.NO_SHOW}),
            row({procedureName: null}),
        ]);

        expect(report.byProcedure).toEqual([
            {procedureName: 'Limpeza', count: 2, completed: 1},
            {procedureName: null, count: 1, completed: 1},
        ]);
    });
});

describe('isValidTimeZone', () => {
    it('accepts IANA zones and rejects anything else', () => {
        expect(isValidTimeZone('America/Sao_Paulo')).toBe(true);
        expect(isValidTimeZone('UTC')).toBe(true);
        expect(isValidTimeZone('Mars/Olympus')).toBe(false);
    });
});
