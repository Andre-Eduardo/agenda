import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {fakeBlockade} from '../../../../domain/blockade/entities/__tests__/fake-blockade';
import {CompanyId} from '../../../../domain/company/entities';
import type {Defect} from '../../../../domain/defect/entities';
import {fakeDefect} from '../../../../domain/defect/entities/__tests__/fake-defect';
import {RoomId} from '../../../../domain/room/entities';
import {UserId} from '../../../../domain/user/entities';
import type {PaginatedDto} from '../../../@shared/dto';
import type {FinishBlockadeDto, StartBlockadeDto, UpdateBlockadeInputDto} from '../../dtos';
import {BlockadeDto} from '../../dtos';
import type {
    FinishBlockadeService,
    GetBlockadeByRoomService,
    GetBlockadeService,
    ListBlockadeService,
    StartBlockadeService,
    UpdateBlockadeService,
} from '../../services';
import {BlockadeController} from '../blockade.controller';

describe('A blockade controller', () => {
    const updateBlockadeServiceMock = mock<UpdateBlockadeService>();
    const startBlockadeServiceMock = mock<StartBlockadeService>();
    const getBlockadeServiceMock = mock<GetBlockadeService>();
    const getBlockadeByRoomServiceMock = mock<GetBlockadeByRoomService>();
    const listBlockadeServiceMock = mock<ListBlockadeService>();
    const finishBlockadeServiceMock = mock<FinishBlockadeService>();

    const blockadeController = new BlockadeController(
        startBlockadeServiceMock,
        updateBlockadeServiceMock,
        listBlockadeServiceMock,
        getBlockadeServiceMock,
        getBlockadeByRoomServiceMock,
        finishBlockadeServiceMock
    );

    const existingDefects: Defect[] = [fakeDefect(), fakeDefect()];

    const companyId = CompanyId.generate();
    const roomId = RoomId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    describe('when starting a blockade', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload: StartBlockadeDto = {
                companyId,
                roomId,
                note: 'note',
                defects: existingDefects.map((defect) => defect.id),
            };

            const blockade = new BlockadeDto({
                ...fakeBlockade({...payload, defects: existingDefects.map((defect) => defect.id)}),
                defects: existingDefects,
            });

            jest.spyOn(startBlockadeServiceMock, 'execute').mockResolvedValueOnce(blockade);

            await expect(blockadeController.startBlockade(actor, payload)).resolves.toEqual(blockade);

            expect(startBlockadeServiceMock.execute).toHaveBeenCalledWith({actor, payload});
            expect(finishBlockadeServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when updating a blockade', () => {
        it('should repass the responsibility to the right service', async () => {
            const blockade = fakeBlockade({
                companyId,
                note: 'Defect 1',
                defects: existingDefects.map((defect) => defect.id),
            });

            const payload: UpdateBlockadeInputDto = {
                note: 'Defect 1 updated',
            };

            const existingBlockade = new BlockadeDto({
                ...blockade,
                defects: existingDefects,
            });

            jest.spyOn(updateBlockadeServiceMock, 'execute').mockResolvedValueOnce(existingBlockade);

            await expect(blockadeController.updateBlockade(actor, blockade.id, payload)).resolves.toEqual(
                existingBlockade
            );

            expect(updateBlockadeServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: blockade.id, ...payload},
            });
        });
    });

    describe('when listing blockade', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload = {
                companyId,
                pagination: {
                    limit: 10,
                },
            };
            const blockades = [
                fakeBlockade({
                    companyId,
                    defects: [existingDefects[0].id],
                }),
                fakeBlockade({companyId, defects: [existingDefects[1].id]}),
            ];
            const expectedResult: PaginatedDto<BlockadeDto> = {
                data: blockades.map((blockade) => new BlockadeDto({...blockade, defects: existingDefects})),
                totalCount: 2,
                nextCursor: null,
            };

            jest.spyOn(listBlockadeServiceMock, 'execute').mockResolvedValueOnce(expectedResult);

            await expect(blockadeController.listBlockade(actor, payload)).resolves.toEqual(expectedResult);

            expect(listBlockadeServiceMock.execute).toHaveBeenCalledWith({actor, payload});
        });
    });

    describe('when getting a blockade', () => {
        it('should repass the responsibility to the right service', async () => {
            const blockade = fakeBlockade({companyId, defects: [existingDefects[0].id]});

            const expectedBlockade = new BlockadeDto({...blockade, defects: existingDefects});

            jest.spyOn(getBlockadeServiceMock, 'execute').mockResolvedValue(expectedBlockade);

            await expect(blockadeController.getBlockade(actor, blockade.id)).resolves.toEqual(expectedBlockade);

            expect(getBlockadeServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id: blockade.id}});
        });
    });

    describe('when getting a blockade by room ID', () => {
        it('should repass the responsibility to the right service', async () => {
            const blockade = fakeBlockade({companyId, defects: [existingDefects[0].id]});

            const expectedBlockade = new BlockadeDto({...blockade, defects: existingDefects});

            jest.spyOn(getBlockadeByRoomServiceMock, 'execute').mockResolvedValue(expectedBlockade);

            await expect(blockadeController.getBlockadeByRoom(actor, blockade.roomId)).resolves.toEqual(
                expectedBlockade
            );

            expect(getBlockadeByRoomServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {roomId: blockade.roomId},
            });
        });
    });

    describe('when finish a blockade', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload: FinishBlockadeDto = {
                roomId: RoomId.generate(),
            };

            await blockadeController.finishBlockade(actor, payload.roomId);

            expect(finishBlockadeServiceMock.execute).toHaveBeenCalledWith({actor, payload: {...payload}});
        });
    });
});
