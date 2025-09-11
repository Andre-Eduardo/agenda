import {InvalidInputException} from '../../../@shared/exceptions';
import {CompanyId} from '../../../company/entities';
import {DefectId} from '../../../defect/entities';
import {RoomId} from '../../../room/entities';
import {RoomStatusId} from '../../../room-status/entities';
import {UserId} from '../../../user/entities';
import {BlockadeChangedEvent, BlockadeFinishedEvent, BlockadeStartedEvent} from '../../events';
import type {StartBlockade} from '../blockade.entity';
import {Blockade} from '../blockade.entity';
import {fakeBlockade} from './fake-blockade';

describe('A blockade', () => {
    const now = new Date(1000);
    const companyId = CompanyId.generate();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on starting', () => {
        it('should emit a blockade-started event', () => {
            const roomId = RoomId.generate();
            const startedById = UserId.generate();

            const data: StartBlockade = {
                companyId,
                roomId,
                startedById,
                note: 'note',
                defects: [DefectId.generate()],
            };

            const blockade = Blockade.start(data);

            expect(blockade.id).toBeInstanceOf(RoomStatusId);
            expect(blockade.companyId).toBeInstanceOf(CompanyId);
            expect(blockade.roomId).toBeInstanceOf(RoomId);
            expect(blockade.startedById).toBeInstanceOf(UserId);
            expect(blockade.startedById).toBe(startedById);
            expect(blockade.startedAt).toEqual(now);
            expect(blockade.finishedById).toBeNull();
            expect(blockade.finishedAt).toBeNull();

            expect(blockade.events).toEqual([
                {
                    type: BlockadeStartedEvent.type,
                    companyId,
                    blockade,
                    timestamp: now,
                },
            ]);

            expect(blockade.events[0]).toBeInstanceOf(BlockadeStartedEvent);
        });

        it.each([
            [{note: ''}, 'Blockade note must be at least 1 character long.'],
            [{defects: []}, 'Blockade defects must be at least 1 defect.'],
        ])('should throw an error when receiving invalid data', (payload, expectError) => {
            expect(() => fakeBlockade(payload)).toThrowWithMessage(InvalidInputException, expectError);
        });
    });

    describe('on change', () => {
        it('should emit a blockade-changed event', () => {
            const blockade = fakeBlockade({companyId});

            const oldBlockade = fakeBlockade(blockade);
            const newDefects = [DefectId.generate(), DefectId.generate()];

            blockade.change({
                note: 'new note',
                defects: newDefects,
            });

            expect(blockade.note).toBe('new note');
            expect(blockade.defects).toEqual(newDefects);

            expect(blockade.events).toEqual([
                {
                    type: BlockadeChangedEvent.type,
                    timestamp: now,
                    companyId,
                    oldState: oldBlockade,
                    newState: blockade,
                },
            ]);

            expect(blockade.events[0]).toBeInstanceOf(BlockadeChangedEvent);
        });

        it.each([
            [{note: ''}, 'Blockade note must be at least 1 character long.'],
            [{defects: []}, 'Blockade defects must be at least 1 defect.'],
        ])('should throw an error when receiving invalid data', (payload, expectError) => {
            const existingBlockade = fakeBlockade();

            expect(() => existingBlockade.change(payload)).toThrowWithMessage(InvalidInputException, expectError);
        });
    });

    describe('on finish', () => {
        it('should emit a blockade-finished event', () => {
            const endUser = UserId.generate();

            const blockade = fakeBlockade({companyId});

            blockade.finish(endUser);

            expect(blockade.finishedById).toBe(endUser);
            expect(blockade.finishedAt).toEqual(now);

            expect(blockade.events).toEqual([
                {
                    type: BlockadeFinishedEvent.type,
                    companyId,
                    blockadeId: blockade.id,
                    finishedById: blockade.finishedById,
                    timestamp: now,
                },
            ]);

            expect(blockade.events[0]).toBeInstanceOf(BlockadeFinishedEvent);
        });
    });

    it.each([
        {
            finishedById: null,
            finishedAt: null,
        },
        {
            finishedById: UserId.generate(),
            finishedAt: new Date(1000),
        },
    ])('should be serializable', (values) => {
        const blockade = fakeBlockade({...values, note: 'note', defects: [DefectId.generate()]});

        expect(blockade.toJSON()).toEqual({
            id: blockade.id.toJSON(),
            companyId: blockade.companyId.toJSON(),
            note: 'note',
            defects: blockade.defects.map((defectId) => defectId.toJSON()),
            roomId: blockade.roomId.toJSON(),
            startedById: blockade.startedById.toJSON(),
            startedAt: blockade.startedAt.toJSON(),
            finishedById: blockade.finishedById?.toJSON() ?? null,
            finishedAt: blockade.finishedAt?.toJSON() ?? null,
            createdAt: new Date(1000).toJSON(),
            updatedAt: new Date(1000).toJSON(),
        });
    });
});
