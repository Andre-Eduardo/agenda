import {InvalidInputException} from '../../../@shared/exceptions';
import {CompanyId} from '../../../company/entities';
import {DefectId} from '../../../defect/entities';
import {RoomId} from '../../../room/entities';
import {RoomStatusId} from '../../../room-status/entities';
import {UserId} from '../../../user/entities';
import {MaintenanceChangedEvent, MaintenanceCreatedEvent, MaintenanceFinishedEvent} from '../../events';
import type {CreateMaintenance} from '../maintenance.entity';
import {Maintenance} from '../maintenance.entity';
import {fakeMaintenance} from './fake-maintenance';

describe('A maintenance', () => {
    const now = new Date(1000);
    const companyId = CompanyId.generate();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on creation', () => {
        it('should emit a maintenance-created event', () => {
            const roomId = RoomId.generate();
            const startedById = UserId.generate();

            const data: CreateMaintenance = {
                companyId,
                roomId,
                startedById,
                note: 'note',
                defects: [DefectId.generate()],
            };

            const maintenance = Maintenance.create(data);

            expect(maintenance.id).toBeInstanceOf(RoomStatusId);
            expect(maintenance.companyId).toBeInstanceOf(CompanyId);
            expect(maintenance.roomId).toBeInstanceOf(RoomId);
            expect(maintenance.startedById).toBeInstanceOf(UserId);
            expect(maintenance.startedById).toBe(startedById);
            expect(maintenance.startedAt).toEqual(now);
            expect(maintenance.finishedById).toBeNull();
            expect(maintenance.finishedAt).toBeNull();

            expect(maintenance.events).toEqual([
                {
                    type: MaintenanceCreatedEvent.type,
                    companyId,
                    maintenance,
                    timestamp: now,
                },
            ]);

            expect(maintenance.events[0]).toBeInstanceOf(MaintenanceCreatedEvent);
        });

        it.each([
            [{note: ''}, 'Maintenance note must be at least 1 character long.'],
            [{defects: []}, 'Maintenance defects must be at least 1 defect.'],
        ])('should throw an error when receiving invalid data', (payload, expectError) => {
            expect(() => fakeMaintenance(payload)).toThrowWithMessage(InvalidInputException, expectError);
        });
    });

    describe('on change', () => {
        it('should emit a maintenance-changed event', () => {
            const maintenance = fakeMaintenance({companyId});

            const oldMaintenance = fakeMaintenance(maintenance);
            const newDefects = [DefectId.generate(), DefectId.generate()];

            maintenance.change({
                note: 'new note',
                defects: newDefects,
            });

            expect(maintenance.note).toBe('new note');
            expect(maintenance.defects).toEqual(newDefects);

            expect(maintenance.events).toEqual([
                {
                    type: MaintenanceChangedEvent.type,
                    timestamp: now,
                    companyId,
                    oldState: oldMaintenance,
                    newState: maintenance,
                },
            ]);

            expect(maintenance.events[0]).toBeInstanceOf(MaintenanceChangedEvent);
        });

        it.each([
            [{note: ''}, 'Maintenance note must be at least 1 character long.'],
            [{defects: []}, 'Maintenance defects must be at least 1 defect.'],
        ])('should throw an error when receiving invalid data', (payload, expectError) => {
            const existingMaintenance = fakeMaintenance();

            expect(() => existingMaintenance.change(payload)).toThrowWithMessage(InvalidInputException, expectError);
        });
    });

    describe('on finish', () => {
        it('should emit a maintenance-finished event', () => {
            const endUser = UserId.generate();

            const maintenance = fakeMaintenance({companyId});

            maintenance.finish(endUser);

            expect(maintenance.finishedById).toBe(endUser);
            expect(maintenance.finishedAt).toEqual(now);

            expect(maintenance.events).toEqual([
                {
                    type: MaintenanceFinishedEvent.type,
                    companyId,
                    maintenanceId: maintenance.id,
                    finishedById: maintenance.finishedById,
                    timestamp: now,
                },
            ]);

            expect(maintenance.events[0]).toBeInstanceOf(MaintenanceFinishedEvent);
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
        const maintenance = fakeMaintenance({...values, note: 'note', defects: [DefectId.generate()]});

        expect(maintenance.toJSON()).toEqual({
            id: maintenance.id.toJSON(),
            companyId: maintenance.companyId.toJSON(),
            note: 'note',
            defects: maintenance.defects.map((defectId) => defectId.toJSON()),
            roomId: maintenance.roomId.toJSON(),
            startedById: maintenance.startedById.toJSON(),
            startedAt: maintenance.startedAt.toJSON(),
            finishedById: maintenance.finishedById?.toJSON() ?? null,
            finishedAt: maintenance.finishedAt?.toJSON() ?? null,
            createdAt: new Date(1000).toJSON(),
            updatedAt: new Date(1000).toJSON(),
        });
    });
});
