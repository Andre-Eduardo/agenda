import {CompanyId} from '../../../company/entities';
import {RoomId} from '../../../room/entities';
import {RoomStatusId} from '../../../room-status/entities';
import {UserId} from '../../../user/entities';
import {InspectionStartedEvent, InspectionFinishedEvent} from '../../events';
import {Inspection, InspectionEndReasonType} from '../inspection.entity';
import {fakeInspection} from './fake-inspection';

describe('An inspection', () => {
    const companyId = CompanyId.generate();
    const roomId = RoomId.generate();
    const startedById = UserId.generate();
    const now = new Date(1000);

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on start', () => {
        it('should emit an inspection-started event', () => {
            const inspection = Inspection.start({
                startedById,
                companyId,
                roomId,
            });

            expect(inspection.companyId).toEqual(companyId);
            expect(inspection.roomId).toEqual(roomId);
            expect(inspection.startedById).toEqual(startedById);
            expect(inspection.startedAt).toEqual(now);
            expect(inspection.finishedById).toBeNull();
            expect(inspection.finishedAt).toBeNull();
            expect(inspection.note).toBeNull();
            expect(inspection.endReason).toBeNull();
            expect(inspection.createdAt).toEqual(now);
            expect(inspection.updatedAt).toEqual(now);

            expect(inspection.events).toEqual([
                {
                    type: InspectionStartedEvent.type,
                    companyId,
                    inspection,
                    timestamp: now,
                },
            ]);
            expect(inspection.events[0]).toBeInstanceOf(InspectionStartedEvent);
        });
    });

    describe('on approval', () => {
        it.each(['a', null, undefined])('should emit an inspection-finished event', (note) => {
            const responsibleId = UserId.generate();

            const inspection = fakeInspection({
                companyId,
                roomId,
            });

            inspection.finish({finishedById: responsibleId, note, endReason: InspectionEndReasonType.APPROVED});

            expect(inspection.companyId).toEqual(companyId);
            expect(inspection.roomId).toEqual(roomId);
            expect(inspection.startedById).toEqual(inspection.startedById);
            expect(inspection.finishedById).toEqual(responsibleId);
            expect(inspection.finishedAt).toEqual(now);
            expect(inspection.endReason).toEqual(InspectionEndReasonType.APPROVED);
            expect(inspection.note).toEqual(note === undefined ? null : note);
            expect(inspection.createdAt).toEqual(now);
            expect(inspection.updatedAt).toEqual(now);

            expect(inspection.events).toEqual([
                {
                    type: InspectionFinishedEvent.type,
                    companyId,
                    inspectionId: inspection.id,
                    finishedById: responsibleId,
                    endReason: InspectionEndReasonType.APPROVED,
                    timestamp: now,
                },
            ]);
            expect(inspection.events[0]).toBeInstanceOf(InspectionFinishedEvent);
        });
    });

    describe('on rejection', () => {
        it.each(['a', null, undefined])('should emit an inspection-finished event', (note) => {
            const responsibleId = UserId.generate();

            const inspection = fakeInspection({
                companyId,
                roomId,
            });

            inspection.finish({finishedById: responsibleId, note, endReason: InspectionEndReasonType.REJECTED});

            expect(inspection.companyId).toEqual(companyId);
            expect(inspection.roomId).toEqual(roomId);
            expect(inspection.startedById).toEqual(inspection.startedById);
            expect(inspection.finishedById).toEqual(responsibleId);
            expect(inspection.finishedAt).toEqual(now);
            expect(inspection.endReason).toEqual(InspectionEndReasonType.REJECTED);
            expect(inspection.note).toEqual(note === undefined ? null : note);
            expect(inspection.createdAt).toEqual(now);
            expect(inspection.updatedAt).toEqual(now);

            expect(inspection.events).toEqual([
                {
                    type: InspectionFinishedEvent.type,
                    companyId,
                    inspectionId: inspection.id,
                    finishedById: responsibleId,
                    endReason: InspectionEndReasonType.REJECTED,
                    timestamp: now,
                },
            ]);
            expect(inspection.events[0]).toBeInstanceOf(InspectionFinishedEvent);
        });
    });

    describe('on expiration', () => {
        it('should emit an inspection-finished event', () => {
            const inspection = fakeInspection({
                companyId,
                roomId,
            });

            inspection.finish({endReason: InspectionEndReasonType.EXPIRED});

            expect(inspection.companyId).toEqual(companyId);
            expect(inspection.roomId).toEqual(roomId);
            expect(inspection.startedById).toEqual(inspection.startedById);
            expect(inspection.finishedById).toEqual(inspection.startedById);
            expect(inspection.finishedAt).toEqual(now);
            expect(inspection.endReason).toEqual(InspectionEndReasonType.EXPIRED);
            expect(inspection.note).toBeNull();
            expect(inspection.createdAt).toEqual(now);
            expect(inspection.updatedAt).toEqual(now);

            expect(inspection.events).toEqual([
                {
                    type: InspectionFinishedEvent.type,
                    companyId,
                    inspectionId: inspection.id,
                    finishedById: inspection.finishedById,
                    endReason: InspectionEndReasonType.EXPIRED,
                    timestamp: now,
                },
            ]);
            expect(inspection.events[0]).toBeInstanceOf(InspectionFinishedEvent);
        });
    });

    it.each([
        {
            finishedById: UserId.generate(),
            finishedAt: new Date(2000),
        },
        {
            finishedById: null,
            finishedAt: null,
        },
    ])('should be serializable', ({finishedById, finishedAt}) => {
        const inspection = fakeInspection({
            companyId,
            roomId,
            finishedById,
            startedAt: new Date(1000),
            finishedAt,
            note: 'a',
            endReason: InspectionEndReasonType.APPROVED,
        });

        expect(inspection.toJSON()).toEqual({
            companyId: inspection.companyId.toJSON(),
            id: inspection.id.toJSON(),
            roomId: inspection.roomId.toJSON(),
            startedById: inspection.startedById.toJSON(),
            startedAt: inspection.startedAt.toJSON(),
            finishedById: inspection.finishedById ? inspection.finishedById.toJSON() : null,
            finishedAt: inspection.finishedAt ? inspection.finishedAt.toJSON() : null,
            note: 'a',
            endReason: InspectionEndReasonType.APPROVED,
            createdAt: inspection.createdAt.toJSON(),
            updatedAt: inspection.updatedAt.toJSON(),
        });
    });
});

describe('An inspection ID', () => {
    it('can be created from a string', () => {
        const uuid = '6267dbfa-177a-4596-882e-99572932ffce';
        const id = RoomStatusId.from(uuid);

        expect(id.toString()).toBe(uuid);
    });

    it('can be generated', () => {
        expect(RoomStatusId.generate()).toBeInstanceOf(RoomStatusId);
    });
});
