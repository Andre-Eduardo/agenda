import {InvalidInputException} from '../../../@shared/exceptions';
import {CompanyId} from '../../../company/entities';
import {DefectTypeId} from '../../../defect-type/entities';
import {RoomId} from '../../../room/entities';
import {UserId} from '../../../user/entities';
import {DefectChangedEvent, DefectCreatedEvent, DefectDeletedEvent, DefectFinishedEvent} from '../../events';
import type {CreateDefect} from '../defect.entity';
import {Defect, DefectId} from '../defect.entity';
import {fakeDefect} from './fake-defect';

describe('A defect', () => {
    const companyId = CompanyId.generate();
    const now = new Date(1000);

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on creation', () => {
        it('should emit a defect-created event', () => {
            const data: CreateDefect = {
                companyId,
                roomId: RoomId.generate(),
                defectTypeId: DefectTypeId.generate(),
                createdById: UserId.generate(),
            };

            const defect = Defect.create(data);

            expect(defect.id).toBeInstanceOf(DefectId);
            expect(defect.companyId).toBe(companyId);
            expect(defect.note).toBe(data.note ?? null);
            expect(defect.roomId).toBe(data.roomId);
            expect(defect.defectTypeId).toBe(data.defectTypeId);
            expect(defect.createdById).toBe(data.createdById);
            expect(defect.createdAt).toEqual(now);
            expect(defect.finishedById).toBe(null);
            expect(defect.finishedAt).toBe(null);

            expect(defect.events).toEqual([
                {
                    type: DefectCreatedEvent.type,
                    companyId,
                    defect,
                    timestamp: now,
                },
            ]);
            expect(defect.events[0]).toBeInstanceOf(DefectCreatedEvent);
        });

        it('should throw an error when receiving invalid data', () => {
            expect(() => fakeDefect({note: ''})).toThrowWithMessage(
                InvalidInputException,
                'Defect note must be at least 1 character long.'
            );
        });
    });

    describe('on change', () => {
        it('should emit a defect-changed event', () => {
            const defect = fakeDefect({companyId, note: null});

            const oldDefect = fakeDefect(defect);
            const newDefectTypeId = DefectTypeId.generate();
            const newRoomId = RoomId.generate();

            defect.change({
                note: 'Defect 2',
                defectTypeId: newDefectTypeId,
                roomId: newRoomId,
            });

            expect(defect.note).toBe('Defect 2');
            expect(defect.defectTypeId).toBe(newDefectTypeId);
            expect(defect.roomId).toBe(newRoomId);

            expect(defect.events).toEqual([
                {
                    type: DefectChangedEvent.type,
                    timestamp: now,
                    companyId,
                    oldState: oldDefect,
                    newState: defect,
                },
            ]);

            expect(defect.events[0]).toBeInstanceOf(DefectChangedEvent);
        });

        it('should throw an error when receiving invalid data', () => {
            const defect = fakeDefect();

            expect(() => defect.change({note: ''})).toThrowWithMessage(
                InvalidInputException,
                'Defect note must be at least 1 character long.'
            );
        });
    });

    describe('on deletion', () => {
        it('should emit a defect-deleted event', () => {
            const defect = fakeDefect({companyId});

            defect.delete();

            expect(defect.events).toEqual([
                {
                    type: DefectDeletedEvent.type,
                    timestamp: now,
                    companyId,
                    defect,
                },
            ]);

            expect(defect.events[0]).toBeInstanceOf(DefectDeletedEvent);
        });
    });

    describe('on finish', () => {
        it('should emit a defect-finished event', () => {
            const defect = fakeDefect({companyId});

            defect.finish(UserId.generate());

            expect(defect.finishedById).toBeInstanceOf(UserId);
            expect(defect.finishedAt).toEqual(now);

            expect(defect.events).toEqual([
                {
                    type: DefectFinishedEvent.type,
                    timestamp: now,
                    companyId,
                    defectId: defect.id,
                    finishedById: defect.finishedById,
                },
            ]);

            expect(defect.events[0]).toBeInstanceOf(DefectFinishedEvent);
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
    ])('should be serializable', ({finishedAt, finishedById}) => {
        const defect = fakeDefect({
            companyId,
            note: 'Defect 1',
            finishedById,
            finishedAt,
            createdAt: new Date(1000),
            updatedAt: new Date(1000),
        });

        expect(defect.toJSON()).toEqual({
            id: defect.id.toString(),
            companyId: companyId.toJSON(),
            note: 'Defect 1',
            roomId: defect.roomId.toJSON(),
            defectTypeId: defect.defectTypeId.toJSON(),
            createdById: defect.createdById.toJSON(),
            finishedById: finishedById?.toJSON() ?? null,
            finishedAt: finishedAt?.toJSON() ?? null,
            createdAt: new Date(1000).toJSON(),
            updatedAt: new Date(1000).toJSON(),
        });
    });
});

describe('A defect ID', () => {
    it('can be created from a string', () => {
        const uuid = '0c64d1cb-764d-44eb-bb3a-973a854dd449';
        const id = DefectId.from(uuid);

        expect(id.toString()).toBe(uuid);
    });

    it('can be generated', () => {
        expect(DefectId.generate()).toBeInstanceOf(DefectId);
    });
});
