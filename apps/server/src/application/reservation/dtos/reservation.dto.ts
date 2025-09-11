import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {Reservation} from '../../../domain/reservation/entities';
import {CompanyEntityDto} from '../../@shared/dto';

@ApiSchema({name: 'Reservation'})
export class ReservationDto extends CompanyEntityDto {
    @ApiProperty({
        description: 'The room that was reserved',
        format: 'uuid',
    })
    roomId: string | null;

    @ApiProperty({
        description: 'The room category that was reserved',
        format: 'uuid',
    })
    roomCategoryId: string | null;

    @ApiProperty({
        description: 'The date and time the guest will check into the room',
        format: 'date-time',
    })
    checkIn: Date;

    @ApiProperty({
        description: 'The user who made the reservation',
        format: 'uuid',
    })
    bookedBy: string;

    @ApiProperty({
        description: 'The person for whom the reservation was made',
        format: 'uuid',
    })
    bookedFor: string;

    @ApiProperty({
        description: 'The date and time the reservation was canceled',
        format: 'date-time',
    })
    canceledAt: Date | null;

    @ApiProperty({
        description: 'The user who canceled the reservation',
        format: 'uuid',
    })
    canceledBy: string | null;

    @ApiProperty({
        description: 'The reason for the cancellation of the reservation',
        example: 'Personal unforeseen',
    })
    canceledReason: string | null;

    @ApiProperty({
        description: 'Indicates whether the guest did not show up for the reservation',
        example: false,
    })
    noShow: boolean;

    @ApiProperty({
        description: 'Any additional notes about the reservation',
        example: 'Guest wants a room with a view of the sea',
    })
    note: string | null;

    constructor(reservation: Reservation) {
        super(reservation);
        this.roomId = reservation.roomId?.toString() ?? null;
        this.roomCategoryId = reservation.roomCategoryId?.toString() ?? null;
        this.checkIn = reservation.checkIn;
        this.bookedBy = reservation.bookedBy.toString();
        this.bookedFor = reservation.bookedFor.toString();
        this.canceledAt = reservation.canceledAt;
        this.canceledBy = reservation.canceledBy?.toString() ?? null;
        this.canceledReason = reservation.canceledReason?.toString() ?? null;
        this.noShow = reservation.noShow;
        this.note = reservation.note;
    }
}
