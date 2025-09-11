import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {CompanyId} from '../../../../domain/company/entities';
import type {EventDispatcher} from '../../../../domain/event';
import {PaymentMethodId} from '../../../../domain/payment-method/entities';
import {PersonId} from '../../../../domain/person/entities';
import {Reservation} from '../../../../domain/reservation/entities';
import {ReservationCreatedEvent} from '../../../../domain/reservation/events';
import type {ReservationRepository} from '../../../../domain/reservation/reservation.repository';
import {RoomId} from '../../../../domain/room/entities';
import type {CreateTransaction} from '../../../../domain/transaction/entities';
import {Transaction, TransactionOriginType, TransactionType} from '../../../../domain/transaction/entities';
import type {TransactionRepository} from '../../../../domain/transaction/transaction.repository';
import {UserId} from '../../../../domain/user/entities';
import type {CreateReservationDto} from '../../dtos';
import {ReservationDto} from '../../dtos';
import {CreateReservationService} from '../create-reservation.service';

describe('A create-reservation service', () => {
    const reservationRepository = mock<ReservationRepository>();
    const transactionRepository = mock<TransactionRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const createReservationService = new CreateReservationService(
        reservationRepository,
        transactionRepository,
        eventDispatcher
    );

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

    it('should create a reservation', async () => {
        const paymentMethodId = PaymentMethodId.generate();

        const payload: CreateReservationDto = {
            companyId: CompanyId.generate(),
            roomId: RoomId.generate(),
            checkIn: new Date(100),
            bookedFor: PersonId.generate(),
            deposits: [{amount: 55.5, paymentMethodId}],
        };

        const reservation = Reservation.create({...payload, bookedBy: actor.userId});

        jest.spyOn(Reservation, 'create').mockReturnValue(reservation);

        const createdTransaction = jest.spyOn(Transaction, 'create');

        const transaction: CreateTransaction = {
            companyId: reservation.companyId,
            responsibleId: reservation.bookedBy,
            counterpartyId: reservation.bookedFor,
            amount: 55.5,
            paymentMethodId,
            type: TransactionType.INCOME,
            originId: reservation.id,
            originType: TransactionOriginType.RESERVATION,
        };

        await expect(createReservationService.execute({actor, payload})).resolves.toEqual(
            new ReservationDto(reservation)
        );

        expect(Reservation.create).toHaveBeenCalledWith({...payload, bookedBy: actor.userId});

        expect(createdTransaction).toHaveBeenCalledWith(transaction);

        expect(reservation.events[0]).toBeInstanceOf(ReservationCreatedEvent);
        expect(reservation.events).toEqual([
            {
                type: ReservationCreatedEvent.type,
                companyId: reservation.companyId,
                reservation,
                timestamp: now,
            },
        ]);

        expect(reservationRepository.save).toHaveBeenCalledWith(reservation);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, reservation);
    });

    it('should throw an error when failing to save the reservation', async () => {
        const payload: CreateReservationDto = {
            companyId: CompanyId.generate(),
            roomId: RoomId.generate(),
            checkIn: new Date(100),
            bookedFor: PersonId.generate(),
        };

        jest.spyOn(reservationRepository, 'save').mockRejectedValue(new Error('generic error'));

        await expect(createReservationService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'generic error'
        );
    });
});
