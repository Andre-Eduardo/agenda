import {InvalidInputException} from '../../../@shared/exceptions';
import {CompanyId} from '../../../company/entities';
import {PersonId} from '../../../person/entities';
import {RoomId} from '../../../room/entities';
import {RoomCategoryId} from '../../../room-category/entities';
import {UserId} from '../../../user/entities';
import {ReservationCanceledEvent, ReservationChangedEvent, ReservationCreatedEvent} from '../../events';
import type {CreateReservation, UpdateReservation} from '../index';
import {Reservation, ReservationId} from '../index';
import {fakeReservation} from './fake-reservation';

describe('A reservation', () => {
    const companyId = CompanyId.generate();
    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on creation', () => {
        it('should emit a reservation-created event', () => {
            const reservation = Reservation.create({
                companyId,
                roomId: RoomId.generate(),
                checkIn: new Date(1000),
                bookedBy: UserId.generate(),
                bookedFor: PersonId.generate(),
            });

            expect(reservation.companyId).toEqual(companyId);
            expect(reservation.roomId).toEqual(reservation.roomId);
            expect(reservation.roomCategoryId).toBeNull();
            expect(reservation.checkIn).toEqual(new Date(1000));
            expect(reservation.bookedBy).toEqual(reservation.bookedBy);
            expect(reservation.bookedFor).toEqual(reservation.bookedFor);
            expect(reservation.canceledAt).toBeNull();
            expect(reservation.canceledBy).toBeNull();
            expect(reservation.canceledReason).toBeNull();
            expect(reservation.noShow).toEqual(false);
            expect(reservation.note).toBeNull();
            expect(reservation.createdAt).toEqual(now);
            expect(reservation.updatedAt).toEqual(now);

            expect(reservation.events).toEqual([
                {
                    type: ReservationCreatedEvent.type,
                    companyId,
                    reservation,
                    timestamp: now,
                },
            ]);
            expect(reservation.events[0]).toBeInstanceOf(ReservationCreatedEvent);
        });

        it('should throw an error when receiving invalid data', () => {
            const reservation: CreateReservation = {
                companyId,
                checkIn: new Date(1000),
                bookedBy: UserId.generate(),
                bookedFor: PersonId.generate(),
            };

            expect(() => Reservation.create(reservation)).toThrowWithMessage(
                InvalidInputException,
                'Either room or room category must be provided.'
            );
        });
    });

    describe('on change', () => {
        it('should emit a reservation-changed event', () => {
            const reservation = fakeReservation({
                companyId,
            });

            const oldReservation = fakeReservation(reservation);

            const data: UpdateReservation = {
                roomId: RoomId.generate(),
                roomCategoryId: null,
                checkIn: new Date(2000),
                bookedFor: PersonId.generate(),
                note: '    ',
                noShow: true,
            };

            reservation.change(data);

            expect(reservation.roomId).toBe(data.roomId);
            expect(reservation.roomCategoryId).toBe(data.roomCategoryId);
            expect(reservation.checkIn).toEqual(new Date(2000));
            expect(reservation.bookedFor).toBe(data.bookedFor);
            expect(reservation.canceledReason).toBeNull();
            expect(reservation.note).toBeNull();
            expect(reservation.noShow).toBeTrue();

            expect(reservation.events).toEqual([
                {
                    type: ReservationChangedEvent.type,
                    companyId,
                    timestamp: now,
                    oldState: oldReservation,
                    newState: reservation,
                },
            ]);
            expect(reservation.events[0]).toBeInstanceOf(ReservationChangedEvent);
        });

        it('should throw an error when receiving invalid data', () => {
            const reservation = fakeReservation({
                companyId,
                roomCategoryId: null,
            });

            const data: UpdateReservation = {
                roomId: null,
            };

            expect(() => reservation.change(data)).toThrow('Either room or room category must be provided.');
        });
    });

    describe('on cancel', () => {
        it('should emit a reservation-cancel event', () => {
            const reservation = fakeReservation({
                roomId: null,
                companyId,
                note: null,
            });

            const data = {
                canceledBy: UserId.generate(),
                canceledReason: ' ',
            };

            reservation.cancel(data.canceledBy, data.canceledReason);

            expect(reservation.companyId).toBe(companyId);
            expect(reservation.roomId).toBeNull();
            expect(reservation.roomCategoryId).toBe(reservation.roomCategoryId);
            expect(reservation.checkIn).toEqual(new Date(1000));
            expect(reservation.bookedBy).toBe(reservation.bookedBy);
            expect(reservation.bookedFor).toBe(reservation.bookedFor);
            expect(reservation.canceledAt).toEqual(now);
            expect(reservation.canceledBy).toEqual(data.canceledBy);
            expect(reservation.canceledReason).toBeNull();
            expect(reservation.note).toBeNull();
            expect(reservation.noShow).toBeFalse();

            expect(reservation.events).toEqual([
                {
                    type: ReservationCanceledEvent.type,
                    companyId,
                    reservation,
                    timestamp: now,
                },
            ]);
            expect(reservation.events[0]).toBeInstanceOf(ReservationCanceledEvent);
        });
    });

    it.each([
        {
            roomId: RoomId.generate(),
            roomCategoryId: null,
        },
        {
            roomId: null,
            roomCategoryId: RoomCategoryId.generate(),
        },
    ])('should be serializable', ({roomId, roomCategoryId}) => {
        const reservation = fakeReservation({
            id: ReservationId.generate(),
            companyId,
            roomId,
            roomCategoryId,
            canceledBy: null,
            canceledReason: null,
            canceledAt: null,
            noShow: false,
            note: 'Note',
        });

        expect(reservation.toJSON()).toEqual({
            id: reservation.id.toJSON(),
            companyId: companyId.toJSON(),
            roomId: roomId?.toJSON() ?? null,
            roomCategoryId: roomCategoryId?.toJSON() ?? null,
            checkIn: reservation.checkIn.toJSON(),
            bookedBy: reservation.bookedBy.toJSON(),
            bookedFor: reservation.bookedFor.toJSON(),
            canceledAt: null,
            canceledBy: null,
            canceledReason: null,
            noShow: false,
            note: 'Note',
            createdAt: reservation.createdAt.toJSON(),
            updatedAt: reservation.updatedAt.toJSON(),
        });
    });
});

describe('A reservation ID', () => {
    it('can be created from a string', () => {
        const uuid = '6267dbfa-177a-4596-882e-99572932ffce';
        const id = ReservationId.from(uuid);

        expect(id.toString()).toBe(uuid);
    });

    it('can be generated', () => {
        expect(ReservationId.generate()).toBeInstanceOf(ReservationId);
    });
});
