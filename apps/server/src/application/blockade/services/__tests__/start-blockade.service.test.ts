import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {PreconditionException, ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import type {BlockadeRepository} from '../../../../domain/blockade/blockade.repository';
import {Blockade} from '../../../../domain/blockade/entities';
import {fakeBlockade} from '../../../../domain/blockade/entities/__tests__/fake-blockade';
import {BlockadeStartedEvent} from '../../../../domain/blockade/events';
import {CompanyId} from '../../../../domain/company/entities';
import type {DefectRepository} from '../../../../domain/defect/defect.repository';
import type {Defect} from '../../../../domain/defect/entities';
import {fakeDefect} from '../../../../domain/defect/entities/__tests__/fake-defect';
import type {EventDispatcher} from '../../../../domain/event';
import {RoomId} from '../../../../domain/room/entities';
import {RoomStateEvent} from '../../../../domain/room/models/room-state';
import type {RoomStateService} from '../../../../domain/room/services';
import {UserId} from '../../../../domain/user/entities';
import type {StartBlockadeDto} from '../../dtos';
import {BlockadeDto} from '../../dtos';
import {StartBlockadeService} from '../start-blockade.service';

describe('A start-blockade service', () => {
    const defectRepository = mock<DefectRepository>();
    const blockadeRepository = mock<BlockadeRepository>();
    const roomStateService = mock<RoomStateService>();
    const eventDispatcher = mock<EventDispatcher>();
    const startBlockadeService = new StartBlockadeService(
        blockadeRepository,
        defectRepository,
        roomStateService,
        eventDispatcher
    );

    const companyId = CompanyId.generate();
    const roomId = RoomId.generate();
    const defects = [
        fakeDefect({companyId}),
        fakeDefect({companyId}),
        fakeDefect({companyId, finishedAt: new Date(), finishedById: UserId.generate()}),
    ];

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

    it('should start a blockade', async () => {
        const paginatedDefects: PaginatedList<Defect> = {
            data: [defects[0], defects[1]],
            totalCount: 2,
            nextCursor: null,
        };

        const payload: StartBlockadeDto = {
            companyId,
            roomId,
            note: 'Note',
            defects: [defects[0].id, defects[1].id],
        };

        const blockade = Blockade.start({...payload, startedById: actor.userId});

        jest.spyOn(defectRepository, 'search').mockResolvedValueOnce(paginatedDefects);
        jest.spyOn(Blockade, 'start').mockReturnValue(blockade);

        await expect(startBlockadeService.execute({actor, payload})).resolves.toEqual(
            new BlockadeDto({...blockade, defects: [defects[0], defects[1]]})
        );

        expect(defectRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: 2,
                sort: {},
            },
            {
                defectIds: [defects[0].id, defects[1].id],
            }
        );
        expect(Blockade.start).toHaveBeenCalledWith({...payload, startedById: actor.userId});

        expect(roomStateService.changeRoomState).toHaveBeenCalledWith(roomId, {
            type: RoomStateEvent.BLOCK,
        });

        expect(blockade.events).toHaveLength(1);
        expect(blockade.events[0]).toBeInstanceOf(BlockadeStartedEvent);
        expect(blockade.events).toEqual([
            {
                type: BlockadeStartedEvent.type,
                companyId,
                timestamp: now,
                blockade,
            },
        ]);
        expect(blockadeRepository.save).toHaveBeenCalledWith(blockade);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, blockade);
    });

    it('should fail to start the blockade when there is already a blockade in the given room', async () => {
        const payload: StartBlockadeDto = {
            companyId,
            roomId,
            note: 'Note',
            defects: [defects[0].id],
        };

        jest.spyOn(blockadeRepository, 'findByRoom').mockResolvedValueOnce(fakeBlockade());

        await expect(startBlockadeService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'There is already blockade in this room.'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    type InvalidDefectTest = {
        searchedDefects: Defect[];
        expectedError: [typeof ResourceNotFoundException | typeof PreconditionException, string];
    };

    it.each<InvalidDefectTest>([
        {
            searchedDefects: [],
            expectedError: [ResourceNotFoundException, 'No defects found.'],
        },
        {
            searchedDefects: [defects[2]],
            expectedError: [PreconditionException, 'A blockade cannot be performed with finished defects.'],
        },
    ])('should fail if defects are invalid', async ({searchedDefects, expectedError}) => {
        const paginatedDefects: PaginatedList<Defect> = {
            data: searchedDefects,
            totalCount: searchedDefects ? 1 : 0,
            nextCursor: null,
        };

        const payload: StartBlockadeDto = {
            companyId,
            roomId,
            note: 'Note',
            defects: [defects[0].id],
        };

        jest.spyOn(defectRepository, 'search').mockResolvedValueOnce(paginatedDefects);

        await expect(startBlockadeService.execute({actor, payload})).rejects.toThrowWithMessage(...expectedError);

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
