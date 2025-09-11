import {Injectable} from '@nestjs/common';
import {PreconditionException, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {ReservationRepository} from '../../../domain/reservation/reservation.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {ReservationDto, CancelReservationDto} from '../dtos';

@Injectable()
export class CancelReservationService implements ApplicationService<CancelReservationDto, ReservationDto> {
    constructor(
        private readonly reservationRepository: ReservationRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CancelReservationDto>): Promise<ReservationDto> {
        const reservation = await this.reservationRepository.findById(payload.id);

        if (!reservation) {
            throw new ResourceNotFoundException('Reservation not found', payload.id.toString());
        }

        if (reservation.canceledAt !== null) {
            throw new PreconditionException('Reservation is already canceled.');
        }

        // TODO: It should not be allowed to cancel a reservation that has already been confirmed.

        reservation.cancel(actor.userId, payload.canceledReason);

        await this.reservationRepository.save(reservation);

        this.eventDispatcher.dispatch(actor, reservation);

        return new ReservationDto(reservation);
    }
}
