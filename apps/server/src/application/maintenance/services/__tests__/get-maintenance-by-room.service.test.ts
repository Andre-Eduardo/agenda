import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import {CompanyId} from '../../../../domain/company/entities';
import type {DefectRepository} from '../../../../domain/defect/defect.repository';
import type {Defect} from '../../../../domain/defect/entities';
import {fakeDefect} from '../../../../domain/defect/entities/__tests__/fake-defect';
import {fakeMaintenance} from '../../../../domain/maintenance/entities/__tests__/fake-maintenance';
import type {MaintenanceRepository} from '../../../../domain/maintenance/maintenance.repository';
import {RoomId} from '../../../../domain/room/entities';
import {UserId} from '../../../../domain/user/entities';
import type {GetMaintenanceByRoomDto} from '../../dtos';
import {MaintenanceDto} from '../../dtos';
import {GetMaintenanceByRoomService} from '../get-maintenance-by-room.service';

describe('A get-maintenance-by-room service', () => {
    const defectRepository = mock<DefectRepository>();
    const maintenanceRepository = mock<MaintenanceRepository>();
    const getMaintenanceByRoomService = new GetMaintenanceByRoomService(maintenanceRepository, defectRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const companyId = CompanyId.generate();
    const defects = [fakeDefect(), fakeDefect()];

    it('should get a maintenance', async () => {
        const paginatedDefects: PaginatedList<Defect> = {
            data: defects,
            totalCount: defects.length,
            nextCursor: null,
        };
        const existingMaintenance = fakeMaintenance({companyId, defects: defects.map((defect) => defect.id)});
        const payload: GetMaintenanceByRoomDto = {
            id: existingMaintenance.roomId,
        };

        jest.spyOn(defectRepository, 'search').mockResolvedValueOnce(paginatedDefects);
        jest.spyOn(maintenanceRepository, 'findByRoom').mockResolvedValueOnce(existingMaintenance);

        await expect(getMaintenanceByRoomService.execute({actor, payload})).resolves.toEqual(
            new MaintenanceDto({...existingMaintenance, defects})
        );

        expect(defectRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: defects.length,
                sort: {},
            },
            {
                defectIds: [defects[0].id, defects[1].id],
            }
        );
        expect(existingMaintenance.events).toHaveLength(0);
        expect(maintenanceRepository.findByRoom).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the maintenance does not exist', async () => {
        const payload: GetMaintenanceByRoomDto = {
            id: RoomId.generate(),
        };

        jest.spyOn(maintenanceRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getMaintenanceByRoomService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'No maintenance found for the room.'
        );
    });
});
