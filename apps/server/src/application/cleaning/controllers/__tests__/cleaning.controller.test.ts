import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {CleaningEndReasonType} from '../../../../domain/cleaning/entities';
import {fakeCleaning} from '../../../../domain/cleaning/entities/__tests__/fake-cleaning';
import {CompanyId} from '../../../../domain/company/entities';
import {RoomId} from '../../../../domain/room/entities';
import {RoomStatusId} from '../../../../domain/room-status/entities';
import {UserId} from '../../../../domain/user/entities';
import type {PaginatedDto} from '../../../@shared/dto';
import type {StartCleaningDto, FinishCleaningInputDto} from '../../dtos';
import {CleaningDto} from '../../dtos/cleaning.dto';
import type {
    StartCleaningService,
    ListCleaningService,
    GetCleaningService,
    FinishCleaningService,
    GetCleaningByRoomService,
} from '../../services';
import {CleaningController} from '../cleaning.controller';

describe('A cleaning controller', () => {
    const startCleaningServiceMock = mock<StartCleaningService>();
    const getCleaningServiceMock = mock<GetCleaningService>();
    const getCleaningByRoomServiceMock = mock<GetCleaningByRoomService>();
    const listCleaningServiceMock = mock<ListCleaningService>();
    const finishCleaningServiceMock = mock<FinishCleaningService>();

    const cleaningController = new CleaningController(
        startCleaningServiceMock,
        listCleaningServiceMock,
        getCleaningServiceMock,
        getCleaningByRoomServiceMock,
        finishCleaningServiceMock
    );

    const companyId = CompanyId.generate();
    const roomId = RoomId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    describe('when starting a cleaning', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload: StartCleaningDto = {
                companyId,
                roomId,
            };

            const cleaning = new CleaningDto(fakeCleaning({...payload}));

            jest.spyOn(startCleaningServiceMock, 'execute').mockResolvedValueOnce(cleaning);

            await expect(cleaningController.startCleaning(actor, payload)).resolves.toEqual(cleaning);

            expect(startCleaningServiceMock.execute).toHaveBeenCalledWith({actor, payload});
            expect(finishCleaningServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when listing cleaning', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload = {
                companyId,
                pagination: {
                    limit: 10,
                },
            };
            const cleanings = [fakeCleaning(), fakeCleaning()];
            const expectedResult: PaginatedDto<CleaningDto> = {
                data: cleanings.map((cleaning) => new CleaningDto(cleaning)),
                totalCount: 2,
                nextCursor: null,
            };

            jest.spyOn(listCleaningServiceMock, 'execute').mockResolvedValueOnce(expectedResult);

            await expect(cleaningController.listCleaning(actor, payload)).resolves.toEqual(expectedResult);

            expect(listCleaningServiceMock.execute).toHaveBeenCalledWith({actor, payload});
        });
    });

    describe('when getting a cleaning', () => {
        it('should repass the responsibility to the right service', async () => {
            const cleaning = fakeCleaning();

            const expectedCleaning = new CleaningDto(cleaning);

            jest.spyOn(getCleaningServiceMock, 'execute').mockResolvedValue(expectedCleaning);

            await expect(cleaningController.getCleaning(actor, cleaning.id)).resolves.toEqual(expectedCleaning);

            expect(getCleaningServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id: cleaning.id}});
        });
    });

    describe('when getting a cleaning by room', () => {
        it('should repass the responsibility to the right service', async () => {
            const cleaning = fakeCleaning();

            const expectedCleaning = new CleaningDto(cleaning);

            jest.spyOn(getCleaningByRoomServiceMock, 'execute').mockResolvedValue(expectedCleaning);

            await expect(cleaningController.getCleaningByRoom(actor, cleaning.roomId)).resolves.toEqual(
                expectedCleaning
            );

            expect(getCleaningByRoomServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {roomId: cleaning.roomId},
            });
        });
    });

    describe('when finish a cleaning', () => {
        it('should repass the responsibility to the right service', async () => {
            const existingCleaning = fakeCleaning({
                id: RoomStatusId.generate(),
                roomId,
            });

            const payload: FinishCleaningInputDto = {
                endReason: CleaningEndReasonType.CANCELED,
            };

            const expectedCleaning = new CleaningDto(existingCleaning);

            jest.spyOn(finishCleaningServiceMock, 'execute').mockResolvedValueOnce(expectedCleaning);

            await cleaningController.finishCleaning(actor, existingCleaning.roomId, payload);

            expect(finishCleaningServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {roomId: existingCleaning.roomId, ...payload},
            });
        });
    });
});
