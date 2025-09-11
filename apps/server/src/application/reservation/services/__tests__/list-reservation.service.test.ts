import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import {CompanyId} from '../../../../domain/company/entities';
import type {Reservation} from '../../../../domain/reservation/entities';
import {fakeReservation} from '../../../../domain/reservation/entities/__tests__/fake-reservation';
import type {ReservationRepository} from '../../../../domain/reservation/reservation.repository';
import {UserId} from '../../../../domain/user/entities';
import type {ListReservationDto} from '../../dtos';
import {ReservationDto} from '../../dtos';
import {ListReservationService} from '../list-reservation.service';

describe('A list-reservation service', () => {
    const reservationRepository = mock<ReservationRepository>();
    const listReservationService = new ListReservationService(reservationRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const companyId = CompanyId.generate();

    const existingReservations: Reservation[] = [
        fakeReservation({
            companyId,
            roomCategoryId: null,
            checkIn: new Date(1000),
            canceledAt: null,
            canceledBy: null,
            canceledReason: null,
            noShow: false,
            note: null,
            createdAt: new Date(1000),
            updatedAt: new Date(1000),
        }),
        fakeReservation({
            companyId,
            roomId: null,
            checkIn: new Date(1000),
            canceledAt: new Date(2000),
            canceledReason: 'reason',
            noShow: false,
            note: null,
            createdAt: new Date(1000),
            updatedAt: new Date(2000),
        }),
    ];

    const paginatedReservations: PaginatedList<Reservation> = {
        data: existingReservations,
        totalCount: existingReservations.length,
        nextCursor: null,
    };

    it('should list reservations', async () => {
        const payload: ListReservationDto = {
            companyId,
            pagination: {
                limit: 2,
                sort: {canceledAt: 'asc'},
            },
            canceledAt: {
                from: new Date(2000),
                to: new Date(2000),
            },
        };

        jest.spyOn(reservationRepository, 'search').mockResolvedValueOnce(paginatedReservations);

        await expect(listReservationService.execute({actor, payload})).resolves.toEqual({
            data: existingReservations.map((reservation) => new ReservationDto(reservation)),
            totalCount: existingReservations.length,
            nextCursor: null,
        });

        expect(existingReservations.flatMap((reservation) => reservation.events)).toHaveLength(0);

        expect(reservationRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: 2,
                sort: {canceledAt: 'asc'},
            },
            {
                canceledAt: {
                    from: new Date(2000),
                    to: new Date(2000),
                },
            }
        );
    });

    it('should paginate reservations', async () => {
        const payload: ListReservationDto = {
            companyId,
            pagination: {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
            },
            canceledAt: null,
        };

        jest.spyOn(reservationRepository, 'search').mockResolvedValueOnce(paginatedReservations);

        await expect(listReservationService.execute({actor, payload})).resolves.toEqual({
            data: existingReservations.map((reservation) => new ReservationDto(reservation)),
            totalCount: existingReservations.length,
            nextCursor: null,
        });

        expect(existingReservations.flatMap((reservation) => reservation.events)).toHaveLength(0);

        expect(reservationRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
                sort: {},
            },
            {
                canceledAt: null,
            }
        );
    });
});
