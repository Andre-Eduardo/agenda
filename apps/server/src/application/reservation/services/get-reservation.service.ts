import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {ReservationRepository} from '../../../domain/reservation/reservation.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {GetReservationDto, ReservationDto} from '../dtos';

@Injectable()
export class GetReservationService implements ApplicationService<GetReservationDto, ReservationDto> {
    constructor(private readonly reservationRepository: ReservationRepository) {}

    async execute({payload}: Command<GetReservationDto>): Promise<ReservationDto> {
        const reservation = await this.reservationRepository.findById(payload.id);

        if (reservation === null) {
            throw new ResourceNotFoundException('Reservation not found', payload.id.toString());
        }

        return new ReservationDto(reservation);
    }
}
