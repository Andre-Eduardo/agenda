import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import {ReservationId} from '../../../../domain/reservation/entities';
import {fakeReservation} from '../../../../domain/reservation/entities/__tests__/fake-reservation';
import type {ReservationRepository} from '../../../../domain/reservation/reservation.repository';
import {UserId} from '../../../../domain/user/entities';
import type {GetReservationDto} from '../../dtos';
import {ReservationDto} from '../../dtos';
import {GetReservationService} from '../get-reservation.service';

describe('A get-reservation service', () => {
    const reservationRepository = mock<ReservationRepository>();
    const getReservationService = new GetReservationService(reservationRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should get a reservation', async () => {
        const existingReservation = fakeReservation({
            roomCategoryId: null,
            canceledAt: null,
            canceledBy: null,
            canceledReason: null,
            noShow: false,
            note: null,
        });

        const payload: GetReservationDto = {
            id: existingReservation.id,
        };

        jest.spyOn(reservationRepository, 'findById').mockResolvedValueOnce(existingReservation);

        await expect(getReservationService.execute({actor, payload})).resolves.toEqual(
            new ReservationDto(existingReservation)
        );

        expect(existingReservation.events).toHaveLength(0);

        expect(reservationRepository.findById).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the reservation does not exist', async () => {
        const payload: GetReservationDto = {
            id: ReservationId.generate(),
        };

        jest.spyOn(reservationRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getReservationService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Reservation not found'
        );
    });
});
