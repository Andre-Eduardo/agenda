import {Injectable} from '@nestjs/common';
import {EventDispatcher} from '../../../domain/event';
import {Reservation} from '../../../domain/reservation/entities';
import {ReservationRepository} from '../../../domain/reservation/reservation.repository';
import {Transaction, TransactionOriginType, TransactionType} from '../../../domain/transaction/entities';
import {TransactionRepository} from '../../../domain/transaction/transaction.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {ReservationDto, CreateReservationDto} from '../dtos';

@Injectable()
export class CreateReservationService implements ApplicationService<CreateReservationDto, ReservationDto> {
    constructor(
        private readonly reservationRepository: ReservationRepository,
        private readonly transactionRepository: TransactionRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreateReservationDto>): Promise<ReservationDto> {
        const reservation = Reservation.create({...payload, bookedBy: actor.userId});

        for (const deposit of payload.deposits ?? []) {
            const newDeposit = Transaction.create({
                companyId: reservation.companyId,
                responsibleId: reservation.bookedBy,
                counterpartyId: reservation.bookedFor,
                amount: deposit.amount,
                paymentMethodId: deposit.paymentMethodId,
                type: TransactionType.INCOME,
                originId: reservation.id,
                originType: TransactionOriginType.RESERVATION,
            });

            await this.transactionRepository.save(newDeposit);

            this.eventDispatcher.dispatch(actor, newDeposit);
        }

        await this.reservationRepository.save(reservation);

        this.eventDispatcher.dispatch(actor, reservation);

        return new ReservationDto(reservation);
    }
}
