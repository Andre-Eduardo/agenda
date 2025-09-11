import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {CompanyId} from '../../../../domain/company/entities';
import {DeepCleaningEndReasonType} from '../../../../domain/deep-cleaning/entities';
import {fakeDeepCleaning} from '../../../../domain/deep-cleaning/entities/__tests__/fake-deep-cleaning';
import {RoomId} from '../../../../domain/room/entities';
import {RoomStatusId} from '../../../../domain/room-status/entities';
import {UserId} from '../../../../domain/user/entities';
import type {PaginatedDto} from '../../../@shared/dto';
import type {StartDeepCleaningDto, FinishDeepCleaningInputDto} from '../../dtos';
import {DeepCleaningDto} from '../../dtos';
import type {
    StartDeepCleaningService,
    FinishDeepCleaningService,
    GetDeepCleaningByRoomService,
    GetDeepCleaningService,
    ListDeepCleaningService,
} from '../../services';
import {DeepCleaningController} from '../deep-cleaning.controller';

describe('A deep cleaning controller', () => {
    const startDeepCleaningServiceMock = mock<StartDeepCleaningService>();
    const listDeepCleaningServiceMock = mock<ListDeepCleaningService>();
    const getDeepCleaningServiceMock = mock<GetDeepCleaningService>();
    const getDeepCleaningByRoomServiceMock = mock<GetDeepCleaningByRoomService>();
    const finishDeepCleaningServiceMock = mock<FinishDeepCleaningService>();

    const deepCleaningController = new DeepCleaningController(
        startDeepCleaningServiceMock,
        listDeepCleaningServiceMock,
        getDeepCleaningServiceMock,
        getDeepCleaningByRoomServiceMock,
        finishDeepCleaningServiceMock
    );

    const companyId = CompanyId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    describe('when starting a deep cleaning', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload: StartDeepCleaningDto = {
                companyId,
                roomId: RoomId.generate(),
            };

            const expectedDeepCleaning = new DeepCleaningDto(fakeDeepCleaning(payload));

            jest.spyOn(startDeepCleaningServiceMock, 'execute').mockResolvedValueOnce(expectedDeepCleaning);

            await expect(deepCleaningController.startDeepCleaning(actor, payload)).resolves.toEqual(
                expectedDeepCleaning
            );

            expect(startDeepCleaningServiceMock.execute).toHaveBeenCalledWith({actor, payload});
            expect(listDeepCleaningServiceMock.execute).not.toHaveBeenCalled();
            expect(getDeepCleaningServiceMock.execute).not.toHaveBeenCalled();
            expect(finishDeepCleaningServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when listing a deep cleaning', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload = {
                companyId,
                pagination: {
                    limit: 10,
                },
            };

            const deepCleanings = [fakeDeepCleaning(), fakeDeepCleaning()];
            const expectedResult: PaginatedDto<DeepCleaningDto> = {
                data: deepCleanings.map((deepCleaning) => new DeepCleaningDto(deepCleaning)),
                totalCount: 2,
                nextCursor: null,
            };

            jest.spyOn(listDeepCleaningServiceMock, 'execute').mockResolvedValueOnce(expectedResult);

            await expect(deepCleaningController.listDeepCleaning(actor, payload)).resolves.toEqual(expectedResult);

            expect(listDeepCleaningServiceMock.execute).toHaveBeenCalledWith({actor, payload});
        });
    });

    describe('when getting a deep cleaning', () => {
        it('should repass the responsibility to the right service', async () => {
            const deepCleaning = fakeDeepCleaning();

            const expectDeepCleaning = new DeepCleaningDto(deepCleaning);

            jest.spyOn(getDeepCleaningServiceMock, 'execute').mockResolvedValueOnce(expectDeepCleaning);

            await expect(deepCleaningController.getDeepCleaning(actor, deepCleaning.id)).resolves.toEqual(
                expectDeepCleaning
            );

            expect(getDeepCleaningServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id: deepCleaning.id}});
        });
    });

    describe('when getting a deep cleaning by room', () => {
        it('should repass the responsibility to the right service', async () => {
            const deepCleaning = fakeDeepCleaning();

            const expectedDeepCleaning = new DeepCleaningDto(deepCleaning);

            jest.spyOn(getDeepCleaningByRoomServiceMock, 'execute').mockResolvedValue(expectedDeepCleaning);

            await expect(deepCleaningController.getDeepCleaningByRoom(actor, deepCleaning.roomId)).resolves.toEqual(
                expectedDeepCleaning
            );

            expect(getDeepCleaningByRoomServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {roomId: deepCleaning.roomId},
            });
        });
    });

    describe('when finishing a deep cleaning', () => {
        it('should repass the responsibility to the right service', async () => {
            const deepCleaning = fakeDeepCleaning({id: RoomStatusId.generate()});

            const payload: FinishDeepCleaningInputDto = {
                endReason: DeepCleaningEndReasonType.FINISHED,
            };

            const expectDeepCleaning = new DeepCleaningDto(deepCleaning);

            jest.spyOn(finishDeepCleaningServiceMock, 'execute').mockResolvedValueOnce(expectDeepCleaning);

            await expect(
                deepCleaningController.finishDeepCleaning(actor, deepCleaning.roomId, payload)
            ).resolves.toEqual(expectDeepCleaning);

            expect(finishDeepCleaningServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {roomId: deepCleaning.roomId, ...payload},
            });
        });
    });
});
