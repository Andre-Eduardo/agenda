import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import {CompanyId} from '../../../../domain/company/entities';
import type {DefectRepository} from '../../../../domain/defect/defect.repository';
import type {Defect} from '../../../../domain/defect/entities';
import {fakeDefect} from '../../../../domain/defect/entities/__tests__/fake-defect';
import type {Maintenance} from '../../../../domain/maintenance/entities';
import {fakeMaintenance} from '../../../../domain/maintenance/entities/__tests__/fake-maintenance';
import type {MaintenanceRepository} from '../../../../domain/maintenance/maintenance.repository';
import {RoomId} from '../../../../domain/room/entities';
import {UserId} from '../../../../domain/user/entities';
import type {ListMaintenanceDto} from '../../dtos';
import {MaintenanceDto} from '../../dtos';
import {ListMaintenanceService} from '../list-maintenance.service';

describe('A list-maintenance service', () => {
    const defectRepository = mock<DefectRepository>();
    const maintenanceRepository = mock<MaintenanceRepository>();
    const listMaintenanceService = new ListMaintenanceService(maintenanceRepository, defectRepository);

    const companyId = CompanyId.generate();
    const roomId = RoomId.generate();
    const defects = [fakeDefect(), fakeDefect()];

    const paginatedDefects: Array<PaginatedList<Defect>> = [
        {
            data: [defects[0]],
            totalCount: 1,
            nextCursor: null,
        },
        {
            data: [defects[1]],
            totalCount: 1,
            nextCursor: null,
        },
    ];

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should list maintenances', async () => {
        const existingMaintenances: Maintenance[] = [
            fakeMaintenance({companyId, defects: [defects[0].id]}),
            fakeMaintenance({companyId, defects: [defects[1].id]}),
        ];

        const paginatedMaintenances: PaginatedList<Maintenance> = {
            data: existingMaintenances,
            totalCount: existingMaintenances.length,
            nextCursor: null,
        };

        const payload: ListMaintenanceDto = {
            companyId,
            pagination: {
                limit: 5,
                sort: {createdAt: 'desc'},
            },
            roomId,
        };

        jest.spyOn(defectRepository, 'search')
            .mockResolvedValueOnce(paginatedDefects[0])
            .mockResolvedValueOnce(paginatedDefects[1]);
        jest.spyOn(maintenanceRepository, 'search').mockResolvedValueOnce(paginatedMaintenances);

        await expect(listMaintenanceService.execute({actor, payload})).resolves.toEqual({
            data: existingMaintenances.map(
                (maintenance, index) =>
                    new MaintenanceDto({
                        ...maintenance,
                        defects: [defects[index]],
                    })
            ),
            totalCount: existingMaintenances.length,
            nextCursor: null,
        });

        expect(existingMaintenances.flatMap((maintenance) => maintenance.events)).toHaveLength(0);

        expect(maintenanceRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: 5,
                sort: {createdAt: 'desc'},
            },
            {
                roomId,
            }
        );
    });

    it('should paginate maintenances', async () => {
        const existingMaintenances: Maintenance[] = [
            fakeMaintenance({companyId, defects: [defects[0].id]}),
            fakeMaintenance({companyId, defects: [defects[1].id]}),
        ];

        const paginatedMaintenances: PaginatedList<Maintenance> = {
            data: [existingMaintenances[0]],
            totalCount: existingMaintenances.length,
            nextCursor: existingMaintenances[1].id.toString(),
        };

        const payload: ListMaintenanceDto = {
            companyId,
            pagination: {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 1,
            },
        };

        jest.spyOn(defectRepository, 'search').mockResolvedValueOnce(paginatedDefects[0]);
        jest.spyOn(maintenanceRepository, 'search').mockResolvedValueOnce(paginatedMaintenances);

        await expect(listMaintenanceService.execute({actor, payload})).resolves.toEqual({
            data: [
                new MaintenanceDto({
                    ...existingMaintenances[0],
                    defects: [defects[0]],
                }),
            ],
            totalCount: existingMaintenances.length,
            nextCursor: existingMaintenances[1].id.toString(),
        });

        expect(existingMaintenances.flatMap((maintenance) => maintenance.events)).toHaveLength(0);

        expect(maintenanceRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 1,
                sort: {},
            },
            {}
        );
    });
});
