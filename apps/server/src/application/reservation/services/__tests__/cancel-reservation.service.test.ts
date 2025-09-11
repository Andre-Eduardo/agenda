import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {PreconditionException, ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {EventDispatcher} from '../../../../domain/event';
import {ReservationId} from '../../../../domain/reservation/entities';
import {fakeReservation} from '../../../../domain/reservation/entities/__tests__/fake-reservation';
import {ReservationCanceledEvent} from '../../../../domain/reservation/events';
import type {ReservationRepository} from '../../../../domain/reservation/reservation.repository';
import {UserId} from '../../../../domain/user/entities';
import type {CancelReservationDto} from '../../dtos';
import {ReservationDto} from '../../dtos';
import {CancelReservationService} from '../cancel-reservation.service';

describe('A cancel-reservation service', () => {
    const reservationRepository = mock<ReservationRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const cancelReservationService = new CancelReservationService(reservationRepository, eventDispatcher);

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

    it('should cancel a reservation', async () => {
        const existingReservation = fakeReservation();

        const payload: CancelReservationDto = {
            id: existingReservation.id,
            canceledReason: 'reason',
        };

        const canceledReservation = fakeReservation({
            ...existingReservation,
            ...payload,
            canceledBy: actor.userId,
            updatedAt: now,
            canceledAt: now,
        });

        jest.spyOn(reservationRepository, 'findById').mockResolvedValueOnce(existingReservation);

        await expect(cancelReservationService.execute({actor, payload})).resolves.toEqual(
            new ReservationDto(canceledReservation)
        );

        expect(existingReservation.events).toHaveLength(1);
        expect(existingReservation.events[0]).toBeInstanceOf(ReservationCanceledEvent);
        expect(existingReservation.events).toEqual([
            {
                type: ReservationCanceledEvent.type,
                companyId: existingReservation.companyId,
                reservation: existingReservation,
                timestamp: now,
            },
        ]);

        expect(reservationRepository.save).toHaveBeenCalledWith(existingReservation);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingReservation);
    });

    it('should throw an error when the reservation does not exist', async () => {
        const payload: CancelReservationDto = {
            id: ReservationId.generate(),
            canceledReason: 'reason',
        };

        jest.spyOn(reservationRepository, 'findById').mockResolvedValueOnce(null);

        await expect(cancelReservationService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Reservation not found'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when the reservation is already canceled', async () => {
        const existingReservation = fakeReservation({
            roomId: null,
            canceledAt: now,
            canceledReason: 'reason',
            noShow: false,
            note: null,
        });

        const payload: CancelReservationDto = {
            id: ReservationId.generate(),
            canceledReason: 'reason',
        };

        jest.spyOn(reservationRepository, 'findById').mockResolvedValueOnce(existingReservation);

        await expect(cancelReservationService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Reservation is already canceled.'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
