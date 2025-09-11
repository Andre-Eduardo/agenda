import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {PreconditionException, ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import {CompanyId} from '../../../../domain/company/entities';
import type {DefectRepository} from '../../../../domain/defect/defect.repository';
import type {Defect} from '../../../../domain/defect/entities';
import {fakeDefect} from '../../../../domain/defect/entities/__tests__/fake-defect';
import type {EventDispatcher} from '../../../../domain/event';
import {Maintenance} from '../../../../domain/maintenance/entities';
import {fakeMaintenance} from '../../../../domain/maintenance/entities/__tests__/fake-maintenance';
import {MaintenanceCreatedEvent} from '../../../../domain/maintenance/events';
import type {MaintenanceRepository} from '../../../../domain/maintenance/maintenance.repository';
import {RoomId} from '../../../../domain/room/entities';
import {RoomStateEvent} from '../../../../domain/room/models/room-state';
import type {RoomStateService} from '../../../../domain/room/services';
import {UserId} from '../../../../domain/user/entities';
import type {StartMaintenanceDto} from '../../dtos';
import {MaintenanceDto} from '../../dtos';
import {StartMaintenanceService} from '../start-maintenance.service';

describe('A start-maintenance service', () => {
    const defectRepository = mock<DefectRepository>();
    const maintenanceRepository = mock<MaintenanceRepository>();
    const roomStateService = mock<RoomStateService>();
    const eventDispatcher = mock<EventDispatcher>();
    const startMaintenance = new StartMaintenanceService(
        maintenanceRepository,
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

    it('should start a maintenance', async () => {
        const paginatedDefects: PaginatedList<Defect> = {
            data: [defects[0], defects[1]],
            totalCount: 2,
            nextCursor: null,
        };

        const payload: StartMaintenanceDto = {
            companyId,
            roomId,
            note: 'Note',
            defects: [defects[0].id, defects[1].id],
        };

        const maintenance = Maintenance.create({...payload, startedById: actor.userId});

        jest.spyOn(defectRepository, 'search').mockResolvedValueOnce(paginatedDefects);
        jest.spyOn(Maintenance, 'create').mockReturnValue(maintenance);

        await expect(startMaintenance.execute({actor, payload})).resolves.toEqual(
            new MaintenanceDto({...maintenance, defects: [defects[0], defects[1]]})
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
        expect(Maintenance.create).toHaveBeenCalledWith({...payload, startedById: actor.userId});

        expect(roomStateService.changeRoomState).toHaveBeenCalledWith(roomId, {
            type: RoomStateEvent.PERFORM_MAINTENANCE,
        });

        expect(maintenance.events).toHaveLength(1);
        expect(maintenance.events[0]).toBeInstanceOf(MaintenanceCreatedEvent);
        expect(maintenance.events).toEqual([
            {
                type: MaintenanceCreatedEvent.type,
                companyId,
                timestamp: now,
                maintenance,
            },
        ]);
        expect(maintenanceRepository.save).toHaveBeenCalledWith(maintenance);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, maintenance);
    });

    it('should fail to start the maintenance when there is already a maintenance in the given room', async () => {
        const payload: StartMaintenanceDto = {
            companyId,
            roomId,
            note: 'Note',
            defects: [defects[0].id],
        };

        jest.spyOn(maintenanceRepository, 'findByRoom').mockResolvedValueOnce(fakeMaintenance());

        await expect(startMaintenance.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'There is already maintenance in this room.'
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
            expectedError: [PreconditionException, 'A maintenance cannot be performed with finished defects.'],
        },
    ])('should fail if defects are invalid', async ({searchedDefects, expectedError}) => {
        const paginatedDefects: PaginatedList<Defect> = {
            data: searchedDefects,
            totalCount: searchedDefects ? 1 : 0,
            nextCursor: null,
        };

        const payload: StartMaintenanceDto = {
            companyId,
            roomId,
            note: 'Note',
            defects: [defects[0].id],
        };

        jest.spyOn(defectRepository, 'search').mockResolvedValueOnce(paginatedDefects);

        await expect(startMaintenance.execute({actor, payload})).rejects.toThrowWithMessage(...expectedError);

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
