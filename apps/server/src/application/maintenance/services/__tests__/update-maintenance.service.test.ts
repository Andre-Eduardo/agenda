import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {PreconditionException, ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import type {DefectRepository} from '../../../../domain/defect/defect.repository';
import type {Defect} from '../../../../domain/defect/entities';
import {fakeDefect} from '../../../../domain/defect/entities/__tests__/fake-defect';
import type {EventDispatcher} from '../../../../domain/event';
import {fakeMaintenance} from '../../../../domain/maintenance/entities/__tests__/fake-maintenance';
import {MaintenanceChangedEvent} from '../../../../domain/maintenance/events';
import type {MaintenanceRepository} from '../../../../domain/maintenance/maintenance.repository';
import {RoomStatusId} from '../../../../domain/room-status/entities';
import {UserId} from '../../../../domain/user/entities';
import type {UpdateMaintenanceDto} from '../../dtos';
import {MaintenanceDto} from '../../dtos';
import {UpdateMaintenanceService} from '../update-maintenance.service';

describe('A update-maintenance service', () => {
    const defectRepository = mock<DefectRepository>();
    const maintenanceRepository = mock<MaintenanceRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const updateMaintenanceService = new UpdateMaintenanceService(
        maintenanceRepository,
        defectRepository,
        eventDispatcher
    );

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
    ])('should update a maintenance', async (defect, paginatedDefect) => {
        const existingMaintenance = fakeMaintenance({defects: [existingDefects[0].id]});

        const oldMaintenance = fakeMaintenance(existingMaintenance);
        const payload: UpdateMaintenanceDto = defect
            ? {
                  id: existingMaintenance.id,
                  note: 'new maintenance',
                  defects: [defect.id],
              }
            : {
                  id: existingMaintenance.id,
                  note: 'new maintenance',
              };

        jest.spyOn(defectRepository, 'search').mockResolvedValueOnce(paginatedDefect);
        jest.spyOn(maintenanceRepository, 'findById').mockResolvedValueOnce(existingMaintenance);

        const updatedMaintenance = fakeMaintenance({
            ...existingMaintenance,
            ...payload,
            updatedAt: now,
        });

        await expect(updateMaintenanceService.execute({actor, payload})).resolves.toEqual(
            new MaintenanceDto({
                ...updatedMaintenance,
                defects: defect ? [defect] : [existingDefects[0]],
            })
        );

        expect(existingMaintenance.note).toBe(payload.note);
        expect(existingMaintenance.updatedAt).toEqual(now);
        expect(existingMaintenance.defects).toEqual(defect ? [defect.id] : [existingDefects[0].id]);
        expect(existingMaintenance.events).toHaveLength(1);
        expect(existingMaintenance.events[0]).toBeInstanceOf(MaintenanceChangedEvent);
        expect(existingMaintenance.events).toEqual([
            {
                type: MaintenanceChangedEvent.type,
                companyId: existingMaintenance.companyId,
                timestamp: now,
                oldState: oldMaintenance,
                newState: existingMaintenance,
            },
        ]);
        expect(maintenanceRepository.save).toHaveBeenCalledWith(existingMaintenance);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingMaintenance);
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
            expectedError: [PreconditionException, 'A maintenance cannot be performed with finished defects.'],
        },
    ])('should fail if defects are invalid', async ({searchedDefects, expectedError}) => {
        const existingMaintenance = fakeMaintenance({defects: [existingDefects[0].id]});
        const paginatedErrorDefects: PaginatedList<Defect> = {
            data: searchedDefects,
            totalCount: searchedDefects ? 1 : 0,
            nextCursor: null,
        };
        const payload: UpdateMaintenanceDto = {
            id: RoomStatusId.generate(),
            defects: [existingDefects[0].id],
        };

        jest.spyOn(defectRepository, 'search').mockResolvedValueOnce(paginatedErrorDefects);
        jest.spyOn(maintenanceRepository, 'findById').mockResolvedValueOnce(existingMaintenance);

        await expect(updateMaintenanceService.execute({actor, payload})).rejects.toThrowWithMessage(...expectedError);

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when the maintenance does not exist', async () => {
        const payload: UpdateMaintenanceDto = {
            id: RoomStatusId.generate(),
            note: 'new maintenance',
        };

        jest.spyOn(maintenanceRepository, 'findById').mockResolvedValueOnce(null);

        await expect(updateMaintenanceService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Maintenance not found'
        );
    });
});
