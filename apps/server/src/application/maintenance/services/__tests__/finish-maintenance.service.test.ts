import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import {CompanyId} from '../../../../domain/company/entities';
import type {DefectRepository} from '../../../../domain/defect/defect.repository';
import type {Defect} from '../../../../domain/defect/entities';
import {fakeDefect} from '../../../../domain/defect/entities/__tests__/fake-defect';
import type {EventDispatcher} from '../../../../domain/event';
import {fakeMaintenance} from '../../../../domain/maintenance/entities/__tests__/fake-maintenance';
import {MaintenanceFinishedEvent} from '../../../../domain/maintenance/events';
import type {MaintenanceRepository} from '../../../../domain/maintenance/maintenance.repository';
import {RoomId} from '../../../../domain/room/entities';
import {RoomStateEvent} from '../../../../domain/room/models/room-state';
import type {RoomStateService} from '../../../../domain/room/services';
import {UserId} from '../../../../domain/user/entities';
import type {FinishMaintenanceDto} from '../../dtos';
import {MaintenanceDto} from '../../dtos';
import {FinishMaintenanceService} from '../finish-maintenance.service';

describe('A finish-maintenance service', () => {
    const defectRepository = mock<DefectRepository>();
    const maintenanceRepository = mock<MaintenanceRepository>();
    const roomStateService = mock<RoomStateService>();
    const eventDispatcher = mock<EventDispatcher>();
    const finishMaintenance = new FinishMaintenanceService(
        maintenanceRepository,
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

    it('should finish a maintenance', async () => {
        const paginatedDefects: PaginatedList<Defect> = {
            data: defects,
            totalCount: defects.length,
            nextCursor: null,
        };
        const payload: FinishMaintenanceDto = {
            roomId,
        };

        const maintenance = fakeMaintenance({defects: defects.map((defect) => defect.id)});

        jest.spyOn(defectRepository, 'search').mockResolvedValueOnce(paginatedDefects);
        jest.spyOn(maintenanceRepository, 'findByRoom').mockResolvedValueOnce(maintenance);

        await expect(finishMaintenance.execute({actor, payload})).resolves.toEqual(
            new MaintenanceDto({...maintenance, finishedAt: now, finishedById: actor.userId, updatedAt: now, defects})
        );

        expect(roomStateService.changeRoomState).toHaveBeenCalledWith(maintenance.roomId, {
            type: RoomStateEvent.COMPLETE_MAINTENANCE,
        });

        expect(maintenance.events).toHaveLength(1);
        expect(maintenance.finishedById).toEqual(actor.userId);
        expect(maintenance.finishedAt).toEqual(now);
        expect(maintenance.events[0]).toBeInstanceOf(MaintenanceFinishedEvent);
        expect(maintenance.events).toEqual([
            {
                type: MaintenanceFinishedEvent.type,
                companyId: maintenance.companyId,
                timestamp: now,
                maintenanceId: maintenance.id,
                finishedById: actor.userId,
            },
        ]);
        expect(maintenanceRepository.save).toHaveBeenCalledWith(maintenance);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, maintenance);
    });

    it('should throw an error when the maintenance does not exist', async () => {
        const payload: FinishMaintenanceDto = {
            roomId,
        };

        jest.spyOn(maintenanceRepository, 'findById').mockResolvedValueOnce(null);

        await expect(finishMaintenance.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Maintenance not found'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
