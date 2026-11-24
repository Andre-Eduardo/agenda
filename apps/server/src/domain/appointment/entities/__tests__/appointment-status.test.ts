import {InvalidInputException, PreconditionException} from '@domain/@shared/exceptions';
import {Appointment, AppointmentStatus, AppointmentType} from '@domain/appointment/entities';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {PatientId} from '@domain/patient/entities';

function appointment(status: AppointmentStatus): Appointment {
    const result = Appointment.create({
        clinicId: ClinicId.generate(),
        patientId: PatientId.generate(),
        attendedByMemberId: ClinicMemberId.generate(),
        createdByMemberId: ClinicMemberId.generate(),
        startAt: new Date('2027-01-01T09:00:00.000Z'),
        endAt: new Date('2027-01-01T10:00:00.000Z'),
        durationMinutes: 60,
        type: AppointmentType.FIRST_VISIT,
        status,
    });

    result.clearEvents();

    return result;
}

const allowed: Array<{from: AppointmentStatus; to: AppointmentStatus; act: (value: Appointment) => void}> = [
    {from: AppointmentStatus.SCHEDULED, to: AppointmentStatus.CONFIRMED, act: (value) => value.confirm()},
    {from: AppointmentStatus.SCHEDULED, to: AppointmentStatus.ARRIVED, act: (value) => value.checkin()},
    {from: AppointmentStatus.CONFIRMED, to: AppointmentStatus.ARRIVED, act: (value) => value.checkin()},
    {from: AppointmentStatus.ARRIVED, to: AppointmentStatus.IN_PROGRESS, act: (value) => value.call()},
    {from: AppointmentStatus.IN_PROGRESS, to: AppointmentStatus.COMPLETED, act: (value) => value.complete()},
    {from: AppointmentStatus.SCHEDULED, to: AppointmentStatus.NO_SHOW, act: (value) => value.noShow()},
    {from: AppointmentStatus.CONFIRMED, to: AppointmentStatus.NO_SHOW, act: (value) => value.noShow()},
    {from: AppointmentStatus.SCHEDULED, to: AppointmentStatus.CANCELLED, act: (value) => value.cancel('Requested')},
    {from: AppointmentStatus.CONFIRMED, to: AppointmentStatus.CANCELLED, act: (value) => value.cancel('Requested')},
    {from: AppointmentStatus.ARRIVED, to: AppointmentStatus.CANCELLED, act: (value) => value.cancel('Requested')},
];

describe('Appointment status transitions', () => {
    it.each(allowed)('accepts $from → $to', ({from, to, act}) => {
        const value = appointment(from);

        act(value);

        expect(value.status).toBe(to);
        expect(value.events.length).toBeGreaterThan(0);
        expect(value.canceledReason).toBe(to === AppointmentStatus.CANCELLED ? 'Requested' : null);
        expect(value.canceledAt instanceof Date).toBe(to === AppointmentStatus.CANCELLED);
        expect(value.arrivedAt instanceof Date).toBe(to === AppointmentStatus.ARRIVED);
        expect(value.calledAt instanceof Date).toBe(to === AppointmentStatus.IN_PROGRESS);
    });

    it.each([
        {from: AppointmentStatus.SCHEDULED, act: (value: Appointment) => value.complete()},
        {from: AppointmentStatus.CONFIRMED, act: (value: Appointment) => value.complete()},
        {from: AppointmentStatus.ARRIVED, act: (value: Appointment) => value.noShow()},
        {from: AppointmentStatus.IN_PROGRESS, act: (value: Appointment) => value.cancel('Requested')},
        {from: AppointmentStatus.COMPLETED, act: (value: Appointment) => value.confirm()},
        {from: AppointmentStatus.CANCELLED, act: (value: Appointment) => value.checkin()},
        {from: AppointmentStatus.NO_SHOW, act: (value: Appointment) => value.confirm()},
    ])('rejects an invalid action from $from without changing state', ({from, act}) => {
        const value = appointment(from);

        expect(() => act(value)).toThrow(PreconditionException);
        expect(value.status).toBe(from);
        expect(value.events).toHaveLength(0);
    });

    it('requires a meaningful cancellation reason', () => {
        const value = appointment(AppointmentStatus.SCHEDULED);

        expect(() => value.cancel('   ')).toThrow(InvalidInputException);
        expect(value.status).toBe(AppointmentStatus.SCHEDULED);
    });

    it('does not allow editing a no-show appointment', () => {
        const value = appointment(AppointmentStatus.NO_SHOW);

        expect(() => value.change({note: 'Changed'})).toThrow(PreconditionException);
    });
});
