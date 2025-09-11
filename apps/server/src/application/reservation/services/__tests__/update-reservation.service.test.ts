import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {EventDispatcher} from '../../../../domain/event';
import {ReservationId} from '../../../../domain/reservation/entities';
import {fakeReservation} from '../../../../domain/reservation/entities/__tests__/fake-reservation';
import {ReservationChangedEvent} from '../../../../domain/reservation/events';
import type {ReservationRepository} from '../../../../domain/reservation/reservation.repository';
import {RoomId} from '../../../../domain/room/entities';
import {RoomCategoryId} from '../../../../domain/room-category/entities';
import {UserId} from '../../../../domain/user/entities';
import type {UpdateReservationDto} from '../../dtos';
import {ReservationDto} from '../../dtos';
import {UpdateReservationService} from '../index';

describe('A update-reservation service', () => {
    const reservationRepository = mock<ReservationRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const updateReservationService = new UpdateReservationService(reservationRepository, eventDispatcher);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should update a reservation', async () => {
        const existingReservation = fakeReservation({
            roomCategoryId: null,
            checkIn: new Date(1000),
            canceledAt: null,
            canceledBy: null,
            canceledReason: null,
            noShow: false,
            note: null,
            createdAt: new Date(1000),
            updatedAt: new Date(1000),
        });

        const oldReservation = fakeReservation(existingReservation);

        const payload: UpdateReservationDto = {
            id: existingReservation.id,
            roomId: RoomId.generate(),
            roomCategoryId: RoomCategoryId.generate(),
            checkIn: new Date(2000),
            note: 'Note',
        };

        jest.spyOn(reservationRepository, 'findById').mockResolvedValueOnce(existingReservation);

        const updatedReservation = fakeReservation({
            ...existingReservation,
            ...payload,
            updatedAt: now,
        });

        await expect(updateReservationService.execute({actor, payload})).resolves.toEqual(
            new ReservationDto(updatedReservation)
        );

        expect(existingReservation.roomId).toBe(payload.roomId);
        expect(existingReservation.roomCategoryId).toBe(payload.roomCategoryId);
        expect(existingReservation.checkIn).toEqual(new Date(2000));
        expect(existingReservation.note).toBe('Note');
        expect(existingReservation.updatedAt).toEqual(now);

        expect(existingReservation.events).toHaveLength(1);
        expect(existingReservation.events[0]).toBeInstanceOf(ReservationChangedEvent);
        expect(existingReservation.events).toEqual([
            {
                type: ReservationChangedEvent.type,
                companyId: existingReservation.companyId,
                timestamp: now,
                oldState: oldReservation,
                newState: existingReservation,
            },
        ]);

        expect(reservationRepository.save).toHaveBeenCalledWith(existingReservation);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingReservation);
    });

    it('should throw an error when the reservation does not exist', async () => {
        const payload: UpdateReservationDto = {
            id: ReservationId.generate(),
            roomCategoryId: RoomCategoryId.generate(),
        };

        jest.spyOn(reservationRepository, 'findById').mockResolvedValueOnce(null);

        await expect(updateReservationService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Reservation not found'
        );
    });
});
