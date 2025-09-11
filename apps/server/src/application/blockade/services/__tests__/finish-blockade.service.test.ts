import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import type {BlockadeRepository} from '../../../../domain/blockade/blockade.repository';
import {fakeBlockade} from '../../../../domain/blockade/entities/__tests__/fake-blockade';
import {BlockadeFinishedEvent} from '../../../../domain/blockade/events';
import {CompanyId} from '../../../../domain/company/entities';
import type {DefectRepository} from '../../../../domain/defect/defect.repository';
import type {Defect} from '../../../../domain/defect/entities';
import {fakeDefect} from '../../../../domain/defect/entities/__tests__/fake-defect';
import type {EventDispatcher} from '../../../../domain/event';
import {RoomId} from '../../../../domain/room/entities';
import {RoomStateEvent} from '../../../../domain/room/models/room-state';
import type {RoomStateService} from '../../../../domain/room/services';
import {UserId} from '../../../../domain/user/entities';
import type {FinishBlockadeDto} from '../../dtos';
import {BlockadeDto} from '../../dtos';
import {FinishBlockadeService} from '../finish-blockade.service';

describe('A finish-blockade service', () => {
    const defectRepository = mock<DefectRepository>();
    const blockadeRepository = mock<BlockadeRepository>();
    const roomStateService = mock<RoomStateService>();
    const eventDispatcher = mock<EventDispatcher>();
    const finishBlockade = new FinishBlockadeService(
        blockadeRepository,
        defectRepository,
        roomStateService,
        eventDispatcher
    );

    const roomId = RoomId.generate();
    const companyId = CompanyId.generate();
    const defects = [fakeDefect({companyId}), fakeDefect({companyId})];
    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should finish a blockade', async () => {
        const paginatedDefects: PaginatedList<Defect> = {
            data: defects,
            totalCount: defects.length,
            nextCursor: null,
        };
        const payload: FinishBlockadeDto = {
            roomId,
        };

        const blockade = fakeBlockade({defects: defects.map((defect) => defect.id)});

        jest.spyOn(defectRepository, 'search').mockResolvedValueOnce(paginatedDefects);
        jest.spyOn(blockadeRepository, 'findByRoom').mockResolvedValueOnce(blockade);

        await expect(finishBlockade.execute({actor, payload})).resolves.toEqual(
            new BlockadeDto({...blockade, finishedAt: now, finishedById: actor.userId, updatedAt: now, defects})
        );

        expect(roomStateService.changeRoomState).toHaveBeenCalledWith(blockade.roomId, {
            type: RoomStateEvent.UNBLOCK,
        });

        expect(blockade.events).toHaveLength(1);
        expect(blockade.finishedById).toEqual(actor.userId);
        expect(blockade.finishedAt).toEqual(now);
        expect(blockade.events[0]).toBeInstanceOf(BlockadeFinishedEvent);
        expect(blockade.events).toEqual([
            {
                type: BlockadeFinishedEvent.type,
                companyId: blockade.companyId,
                timestamp: now,
                blockadeId: blockade.id,
                finishedById: actor.userId,
            },
        ]);
        expect(blockadeRepository.save).toHaveBeenCalledWith(blockade);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, blockade);
    });

    it('should throw an error when the blockade does not exist', async () => {
        const payload: FinishBlockadeDto = {
            roomId,
        };

        jest.spyOn(blockadeRepository, 'findById').mockResolvedValueOnce(null);

        await expect(finishBlockade.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'No Blockade was found in the room'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
