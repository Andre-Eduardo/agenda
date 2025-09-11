import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {PreconditionException, ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import type {BlockadeRepository} from '../../../../domain/blockade/blockade.repository';
import {fakeBlockade} from '../../../../domain/blockade/entities/__tests__/fake-blockade';
import {BlockadeChangedEvent} from '../../../../domain/blockade/events';
import type {DefectRepository} from '../../../../domain/defect/defect.repository';
import type {Defect} from '../../../../domain/defect/entities';
import {fakeDefect} from '../../../../domain/defect/entities/__tests__/fake-defect';
import type {EventDispatcher} from '../../../../domain/event';
import {RoomStatusId} from '../../../../domain/room-status/entities';
import {UserId} from '../../../../domain/user/entities';
import type {UpdateBlockadeDto} from '../../dtos';
import {BlockadeDto} from '../../dtos';
import {UpdateBlockadeService} from '../update-blockade.service';

describe('A update-blockade service', () => {
    const defectRepository = mock<DefectRepository>();
    const blockadeRepository = mock<BlockadeRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const updateBlockadeService = new UpdateBlockadeService(blockadeRepository, defectRepository, eventDispatcher);

    const existingDefects = [
        fakeDefect(),
        fakeDefect(),
        fakeDefect({finishedAt: new Date(), finishedById: UserId.generate()}),
    ];

    const paginatedDefects: Array<PaginatedList<Defect>> = [
        {
            data: [existingDefects[0]],
            totalCount: 1,
            nextCursor: null,
        },
        {
            data: [existingDefects[1]],
            totalCount: 1,
            nextCursor: null,
        },
        {
            data: [existingDefects[2]],
            totalCount: 1,
            nextCursor: null,
        },
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

    it.each([
        [existingDefects[1], paginatedDefects[1]],
        [undefined, paginatedDefects[0]],
    ])('should update a blockade', async (defect, paginatedDefect) => {
        const existingBlockade = fakeBlockade({defects: [existingDefects[0].id]});

        const oldBlockade = fakeBlockade(existingBlockade);

        const payload: UpdateBlockadeDto = defect
            ? {
                  id: existingBlockade.id,
                  note: 'new blockade',
                  defects: [defect.id],
              }
            : {
                  id: existingBlockade.id,
                  note: 'new blockade',
              };

        jest.spyOn(defectRepository, 'search').mockResolvedValueOnce(paginatedDefect);
        jest.spyOn(blockadeRepository, 'findById').mockResolvedValueOnce(existingBlockade);

        const updatedBlockade = fakeBlockade({
            ...existingBlockade,
            ...payload,
            updatedAt: now,
        });

        await expect(updateBlockadeService.execute({actor, payload})).resolves.toEqual(
            new BlockadeDto({
                ...updatedBlockade,
                defects: defect ? [defect] : [existingDefects[0]],
            })
        );

        expect(existingBlockade.note).toBe(payload.note);
        expect(existingBlockade.updatedAt).toEqual(now);
        expect(existingBlockade.defects).toEqual(defect ? [defect.id] : [existingDefects[0].id]);
        expect(existingBlockade.events).toHaveLength(1);
        expect(existingBlockade.events[0]).toBeInstanceOf(BlockadeChangedEvent);
        expect(existingBlockade.events).toEqual([
            {
                type: BlockadeChangedEvent.type,
                companyId: existingBlockade.companyId,
                timestamp: now,
                oldState: oldBlockade,
                newState: existingBlockade,
            },
        ]);
        expect(blockadeRepository.save).toHaveBeenCalledWith(existingBlockade);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingBlockade);
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
            searchedDefects: [existingDefects[2]],
            expectedError: [PreconditionException, 'A blockade cannot be performed with finished defects.'],
        },
    ])('should fail if defects are invalid', async ({searchedDefects, expectedError}) => {
        const existingBlockade = fakeBlockade({defects: [existingDefects[0].id]});
        const paginatedErrorDefects: PaginatedList<Defect> = {
            data: searchedDefects,
            totalCount: searchedDefects.length,
            nextCursor: null,
        };
        const payload: UpdateBlockadeDto = {
            id: RoomStatusId.generate(),
            defects: [existingDefects[0].id],
        };

        jest.spyOn(defectRepository, 'search').mockResolvedValueOnce(paginatedErrorDefects);
        jest.spyOn(blockadeRepository, 'findById').mockResolvedValueOnce(existingBlockade);

        await expect(updateBlockadeService.execute({actor, payload})).rejects.toThrowWithMessage(...expectedError);

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when the blockade does not exist', async () => {
        const payload: UpdateBlockadeDto = {
            id: RoomStatusId.generate(),
            note: 'new blockade',
        };

        jest.spyOn(blockadeRepository, 'findById').mockResolvedValueOnce(null);

        await expect(updateBlockadeService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Blockade not found'
        );
    });
});
