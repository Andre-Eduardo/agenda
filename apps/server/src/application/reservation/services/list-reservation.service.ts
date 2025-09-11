import {Injectable} from '@nestjs/common';
import {ReservationRepository} from '../../../domain/reservation/reservation.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {ReservationDto, ListReservationDto} from '../dtos';

@Injectable()
export class ListReservationService implements ApplicationService<ListReservationDto, PaginatedDto<ReservationDto>> {
    constructor(private readonly reservationRepository: ReservationRepository) {}

    async execute({payload}: Command<ListReservationDto>): Promise<PaginatedDto<ReservationDto>> {
        const result = await this.reservationRepository.search(
            payload.companyId,
            {
                cursor: payload.pagination.cursor ?? undefined,
                limit: payload.pagination.limit,
                sort: payload.pagination.sort ?? {},
            },
            {
                roomId: payload.roomId,
                checkIn: payload.checkIn,
                bookedBy: payload.bookedBy,
                bookedFor: payload.bookedFor,
                canceledAt: payload.canceledAt,
                canceledBy: payload.canceledBy,
                noShow: payload.noShow,
            }
        );

        return {
            ...result,
            data: result.data.map((reservation) => new ReservationDto(reservation)),
        };
    }
}
