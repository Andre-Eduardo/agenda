import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {ReservationRepository} from '../../../domain/reservation/reservation.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {ReservationDto, UpdateReservationDto} from '../dtos';

@Injectable()
export class UpdateReservationService implements ApplicationService<UpdateReservationDto, ReservationDto> {
    constructor(
        private readonly reservationRepository: ReservationRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<UpdateReservationDto>): Promise<ReservationDto> {
        const reservation = await this.reservationRepository.findById(payload.id);

        if (reservation === null) {
            throw new ResourceNotFoundException('Reservation not found', payload.id.toString());
        }

        reservation.change(payload);

        await this.reservationRepository.save(reservation);

        this.eventDispatcher.dispatch(actor, reservation);

        return new ReservationDto(reservation);
    }
}
