import {CompanyId} from '../../../company/entities';
import {PersonId} from '../../../person/entities';
import {RoomId} from '../../../room/entities';
import {RoomCategoryId} from '../../../room-category/entities';
import {UserId} from '../../../user/entities';
import {Reservation, ReservationId} from '../reservation.entity';

export function fakeReservation(payload: Partial<Reservation> = {}): Reservation {
    return new Reservation({
        id: ReservationId.generate(),
        companyId: CompanyId.generate(),
        roomId: RoomId.generate(),
        roomCategoryId: RoomCategoryId.generate(),
        checkIn: new Date(1000),
        bookedBy: UserId.generate(),
        bookedFor: PersonId.generate(),
        canceledBy: null,
        canceledReason: null,
        canceledAt: null,
        noShow: false,
        note: 'Note',
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        ...payload,
    });
}
