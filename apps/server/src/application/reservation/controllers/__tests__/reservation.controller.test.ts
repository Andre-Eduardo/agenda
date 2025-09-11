import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {CompanyId} from '../../../../domain/company/entities';
import {PersonId} from '../../../../domain/person/entities';
import {Reservation} from '../../../../domain/reservation/entities';
import {RoomId} from '../../../../domain/room/entities';
import {RoomCategoryId} from '../../../../domain/room-category/entities';
import {UserId} from '../../../../domain/user/entities';
import type {PaginatedDto} from '../../../@shared/dto';
import {ReservationDto} from '../../dtos';
import type {
    CancelReservationInputDto,
    CreateReservationDto,
    ListReservationDto,
    UpdateReservationInputDto,
} from '../../dtos';
import type {
    CancelReservationService,
    CreateReservationService,
    GetReservationService,
    ListReservationService,
    UpdateReservationService,
} from '../../services';
import {ReservationController} from '../reservation.controller';

describe('A reservation controller', () => {
    const cancelReservationServiceMock = mock<CancelReservationService>();
    const createReservationServiceMock = mock<CreateReservationService>();
    const updateReservationServiceMock = mock<UpdateReservationService>();
    const getReservationServiceMock = mock<GetReservationService>();
    const listReservationServiceMock = mock<ListReservationService>();
    const reservationController = new ReservationController(
        cancelReservationServiceMock,
        createReservationServiceMock,
        getReservationServiceMock,
        listReservationServiceMock,
        updateReservationServiceMock
    );

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const companyId = CompanyId.generate();

    describe('when creating a reservation', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload: CreateReservationDto = {
                companyId,
                roomCategoryId: RoomCategoryId.generate(),
                checkIn: new Date(),
                bookedFor: PersonId.generate(),
            };

            const expectedReservation = new ReservationDto(Reservation.create({...payload, bookedBy: actor.userId}));

            jest.spyOn(createReservationServiceMock, 'execute').mockResolvedValueOnce(expectedReservation);

            await expect(reservationController.createReservation(actor, payload)).resolves.toEqual(expectedReservation);

            expect(cancelReservationServiceMock.execute).not.toHaveBeenCalled();
            expect(createReservationServiceMock.execute).toHaveBeenCalledWith({actor, payload});
            expect(getReservationServiceMock.execute).not.toHaveBeenCalled();
            expect(listReservationServiceMock.execute).not.toHaveBeenCalled();
            expect(updateReservationServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when getting a reservation', () => {
        it('should repass the responsibility to the right service', async () => {
            const reservation = Reservation.create({
                companyId,
                roomId: RoomId.generate(),
                checkIn: new Date(),
                bookedBy: UserId.generate(),
                bookedFor: PersonId.generate(),
            });

            const expectedReservation = new ReservationDto(reservation);

            jest.spyOn(getReservationServiceMock, 'execute').mockResolvedValueOnce(expectedReservation);

            await expect(reservationController.getReservation(actor, reservation.id)).resolves.toEqual(
                expectedReservation
            );

            expect(cancelReservationServiceMock.execute).not.toHaveBeenCalled();
            expect(createReservationServiceMock.execute).not.toHaveBeenCalled();
            expect(getReservationServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id: reservation.id}});
            expect(listReservationServiceMock.execute).not.toHaveBeenCalled();
            expect(updateReservationServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when listing reservations', () => {
        it('should repass the responsibility to the right service', async () => {
            const reservations = [
                Reservation.create({
                    companyId,
                    roomId: RoomId.generate(),
                    checkIn: new Date(),
                    bookedBy: UserId.generate(),
                    bookedFor: PersonId.generate(),
                }),
                Reservation.create({
                    companyId,
                    roomId: RoomId.generate(),
                    checkIn: new Date(200),
                    bookedBy: UserId.generate(),
                    bookedFor: PersonId.generate(),
                    note: 'note',
                }),
            ];

            const payload: ListReservationDto = {
                companyId,
                noShow: true,
                pagination: {
                    limit: 10,
                },
            };

            const expectedResult: PaginatedDto<ReservationDto> = {
                data: reservations.map((roomCategory) => new ReservationDto(roomCategory)),
                totalCount: 2,
                nextCursor: null,
            };

            jest.spyOn(listReservationServiceMock, 'execute').mockResolvedValueOnce(expectedResult);

            await expect(reservationController.listReservation(actor, payload)).resolves.toEqual(expectedResult);

            expect(cancelReservationServiceMock.execute).not.toHaveBeenCalled();
            expect(createReservationServiceMock.execute).not.toHaveBeenCalled();
            expect(getReservationServiceMock.execute).not.toHaveBeenCalled();
            expect(listReservationServiceMock.execute).toHaveBeenCalledWith({actor, payload});
            expect(updateReservationServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when updating a reservation', () => {
        it('should repass the responsibility to the right service', async () => {
            const existingReservation = Reservation.create({
                companyId,
                roomId: RoomId.generate(),
                checkIn: new Date(1000),
                bookedBy: UserId.generate(),
                bookedFor: PersonId.generate(),
            });
            const payload: UpdateReservationInputDto = {
                bookedFor: PersonId.generate(),
                checkIn: new Date(2000),
            };

            const expectedReservation = new ReservationDto(existingReservation);

            jest.spyOn(updateReservationServiceMock, 'execute').mockResolvedValueOnce(expectedReservation);

            await expect(
                reservationController.updateReservation(actor, existingReservation.id, payload)
            ).resolves.toEqual(expectedReservation);

            expect(cancelReservationServiceMock.execute).not.toHaveBeenCalled();
            expect(createReservationServiceMock.execute).not.toHaveBeenCalled();
            expect(getReservationServiceMock.execute).not.toHaveBeenCalled();
            expect(listReservationServiceMock.execute).not.toHaveBeenCalled();
            expect(updateReservationServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: existingReservation.id, ...payload},
            });
        });
    });

    describe('when canceling a reservation', () => {
        it('should repass the responsibility to the right service', async () => {
            const existingReservation = Reservation.create({
                companyId,
                roomId: RoomId.generate(),
                checkIn: new Date(1000),
                bookedBy: UserId.generate(),
                bookedFor: PersonId.generate(),
            });

            const payload: CancelReservationInputDto = {
                canceledReason: 'reason',
            };

            const expectedReservation = new ReservationDto(existingReservation);

            jest.spyOn(cancelReservationServiceMock, 'execute').mockResolvedValueOnce(expectedReservation);

            await expect(
                reservationController.cancelReservation(actor, existingReservation.id, payload)
            ).resolves.toEqual(expectedReservation);

            expect(cancelReservationServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: existingReservation.id, ...payload},
            });
            expect(createReservationServiceMock.execute).not.toHaveBeenCalled();
            expect(getReservationServiceMock.execute).not.toHaveBeenCalled();
            expect(listReservationServiceMock.execute).not.toHaveBeenCalled();
            expect(updateReservationServiceMock.execute).not.toHaveBeenCalled();
        });
    });
});
