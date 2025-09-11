import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {CompanyId} from '../../../../domain/company/entities';
import type {Defect} from '../../../../domain/defect/entities';
import {fakeDefect} from '../../../../domain/defect/entities/__tests__/fake-defect';
import {fakeMaintenance} from '../../../../domain/maintenance/entities/__tests__/fake-maintenance';
import {RoomId} from '../../../../domain/room/entities';
import {UserId} from '../../../../domain/user/entities';
import type {PaginatedDto} from '../../../@shared/dto';
import type {FinishMaintenanceDto, StartMaintenanceDto, UpdateMaintenanceInputDto} from '../../dtos';
import {MaintenanceDto} from '../../dtos';
import type {
    FinishMaintenanceService,
    GetMaintenanceByRoomService,
    GetMaintenanceService,
    ListMaintenanceService,
    StartMaintenanceService,
    UpdateMaintenanceService,
} from '../../services';
import {MaintenanceController} from '../maintenance.controller';

describe('A maintenance controller', () => {
    const updateMaintenanceServiceMock = mock<UpdateMaintenanceService>();
    const startMaintenanceServiceMock = mock<StartMaintenanceService>();
    const getMaintenanceServiceMock = mock<GetMaintenanceService>();
    const getMaintenanceByRoomServiceMock = mock<GetMaintenanceByRoomService>();
    const listMaintenanceServiceMock = mock<ListMaintenanceService>();
    const finishMaintenanceServiceMock = mock<FinishMaintenanceService>();

    const maintenanceController = new MaintenanceController(
        startMaintenanceServiceMock,
        updateMaintenanceServiceMock,
        listMaintenanceServiceMock,
        getMaintenanceServiceMock,
        getMaintenanceByRoomServiceMock,
        finishMaintenanceServiceMock
    );

    const existingDefects: Defect[] = [fakeDefect(), fakeDefect()];

    const companyId = CompanyId.generate();
    const roomId = RoomId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    describe('when creating a maintenance', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload: StartMaintenanceDto = {
                companyId,
                roomId,
                note: 'note',
                defects: existingDefects.map((defect) => defect.id),
            };

            const maintenance = new MaintenanceDto({
                ...fakeMaintenance({...payload, defects: existingDefects.map((defect) => defect.id)}),
                defects: existingDefects,
            });

            jest.spyOn(startMaintenanceServiceMock, 'execute').mockResolvedValueOnce(maintenance);

            await expect(maintenanceController.startMaintenance(actor, payload)).resolves.toEqual(maintenance);

            expect(startMaintenanceServiceMock.execute).toHaveBeenCalledWith({actor, payload});
            expect(finishMaintenanceServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when updating a maintenance', () => {
        it('should repass the responsibility to the right service', async () => {
            const maintenance = fakeMaintenance({
                companyId,
                note: 'Defect 1',
                defects: existingDefects.map((defect) => defect.id),
            });

            const payload: UpdateMaintenanceInputDto = {
                note: 'Defect 1 updated',
            };

            const existingMaintenance = new MaintenanceDto({
                ...maintenance,
                defects: existingDefects,
            });

            jest.spyOn(updateMaintenanceServiceMock, 'execute').mockResolvedValueOnce(existingMaintenance);

            await expect(maintenanceController.updateMaintenance(actor, maintenance.id, payload)).resolves.toEqual(
                existingMaintenance
            );

            expect(updateMaintenanceServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: maintenance.id, ...payload},
            });
        });
    });

    describe('when listing maintenance', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload = {
                companyId,
                pagination: {
                    limit: 10,
                },
            };
            const maintenances = [
                fakeMaintenance({
                    companyId,
                    defects: [existingDefects[0].id],
                }),
                fakeMaintenance({companyId, defects: [existingDefects[1].id]}),
            ];
            const expectedResult: PaginatedDto<MaintenanceDto> = {
                data: maintenances.map((maintenance) => new MaintenanceDto({...maintenance, defects: existingDefects})),
                totalCount: 2,
                nextCursor: null,
            };

            jest.spyOn(listMaintenanceServiceMock, 'execute').mockResolvedValueOnce(expectedResult);

            await expect(maintenanceController.listMaintenance(actor, payload)).resolves.toEqual(expectedResult);

            expect(listMaintenanceServiceMock.execute).toHaveBeenCalledWith({actor, payload});
        });
    });

    describe('when getting a maintenance', () => {
        it('should repass the responsibility to the right service', async () => {
            const maintenance = fakeMaintenance({companyId, defects: [existingDefects[0].id]});

            const expectedMaintenance = new MaintenanceDto({...maintenance, defects: existingDefects});

            jest.spyOn(getMaintenanceServiceMock, 'execute').mockResolvedValue(expectedMaintenance);

            await expect(maintenanceController.getMaintenance(actor, maintenance.id)).resolves.toEqual(
                expectedMaintenance
            );

            expect(getMaintenanceServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id: maintenance.id}});
        });
    });

    describe('when getting a maintenance by room ID', () => {
        it('should repass the responsibility to the right service', async () => {
            const maintenance = fakeMaintenance({companyId, defects: [existingDefects[0].id]});

            const expectedMaintenance = new MaintenanceDto({...maintenance, defects: existingDefects});

            jest.spyOn(getMaintenanceByRoomServiceMock, 'execute').mockResolvedValue(expectedMaintenance);

            await expect(maintenanceController.getMaintenanceByRoom(actor, maintenance.roomId)).resolves.toEqual(
                expectedMaintenance
            );

            expect(getMaintenanceByRoomServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: maintenance.roomId},
            });
        });
    });

    describe('when finish a maintenance', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload: FinishMaintenanceDto = {
                roomId: RoomId.generate(),
            };

            await maintenanceController.finishMaintenance(actor, payload.roomId);

            expect(finishMaintenanceServiceMock.execute).toHaveBeenCalledWith({actor, payload: {...payload}});
        });
    });
});
