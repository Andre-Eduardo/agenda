import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {RoomPermission} from '../../../../domain/auth';
import {CompanyId} from '../../../../domain/company/entities';
import type {CreateEmployeePosition} from '../../../../domain/employee-position/entities';
import {EmployeePosition, EmployeePositionId} from '../../../../domain/employee-position/entities';
import {UserId} from '../../../../domain/user/entities';
import type {PaginatedDto} from '../../../@shared/dto';
import {EmployeePositionDto} from '../../dtos';
import type {
    CreateEmployeePositionService,
    DeleteEmployeePositionService,
    GetEmployeePositionService,
    ListEmployeePositionService,
    UpdateEmployeePositionService,
} from '../../services';
import {EmployeePositionController} from '../employee-position.controller';

describe('An employee position controller', () => {
    const createEmployeePositionServiceMock = mock<CreateEmployeePositionService>();
    const getEmployeePositionServiceMock = mock<GetEmployeePositionService>();
    const listEmployeePositionServiceMock = mock<ListEmployeePositionService>();
    const deleteEmployeePositionServiceMock = mock<DeleteEmployeePositionService>();
    const updateEmployeePositionServiceMock = mock<UpdateEmployeePositionService>();
    const employeePositionController = new EmployeePositionController(
        createEmployeePositionServiceMock,
        listEmployeePositionServiceMock,
        getEmployeePositionServiceMock,
        updateEmployeePositionServiceMock,
        deleteEmployeePositionServiceMock
    );

    const companyId = CompanyId.generate();
    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    describe('when creating an employee position', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload: CreateEmployeePosition = {
                companyId,
                name: 'Manager',
                permissions: new Set([RoomPermission.VIEW]),
            };

            const expectedEmployeePosition = new EmployeePositionDto(EmployeePosition.create(payload));

            jest.spyOn(createEmployeePositionServiceMock, 'execute').mockResolvedValueOnce(expectedEmployeePosition);

            await expect(employeePositionController.createEmployeePosition(actor, payload)).resolves.toEqual(
                expectedEmployeePosition
            );

            expect(createEmployeePositionServiceMock.execute).toHaveBeenCalledWith({actor, payload});
            expect(getEmployeePositionServiceMock.execute).not.toHaveBeenCalled();
            expect(listEmployeePositionServiceMock.execute).not.toHaveBeenCalled();
            expect(deleteEmployeePositionServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when getting an employee position', () => {
        it('should repass the responsibility to the right service', async () => {
            const employeePosition = EmployeePosition.create({
                companyId,
                name: 'Manager',
                permissions: new Set([RoomPermission.VIEW]),
            });

            const expectedEmployeePosition = new EmployeePositionDto(employeePosition);

            jest.spyOn(getEmployeePositionServiceMock, 'execute').mockResolvedValueOnce(expectedEmployeePosition);

            await expect(employeePositionController.getEmployeePosition(actor, employeePosition.id)).resolves.toEqual(
                expectedEmployeePosition
            );

            expect(getEmployeePositionServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: employeePosition.id},
            });
        });
    });

    describe('when deleting an employee position', () => {
        it('should repass the responsibility to the right service', async () => {
            const id = EmployeePositionId.generate();

            await employeePositionController.deleteEmployeePosition(actor, id);

            expect(deleteEmployeePositionServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id}});
        });
    });

    describe('when listing an employee position', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload = {
                companyId,
                name: 'Manager',
                pagination: {
                    limit: 10,
                },
            };

            const employeePositions = [
                EmployeePosition.create({
                    companyId,
                    name: 'Manager',
                    permissions: new Set([RoomPermission.VIEW]),
                }),
                EmployeePosition.create({
                    companyId,
                    name: 'Admin',
                    permissions: new Set([RoomPermission.CREATE]),
                }),
            ];

            const expectedResult: PaginatedDto<EmployeePositionDto> = {
                data: employeePositions.map((employeePosition) => new EmployeePositionDto(employeePosition)),
                totalCount: 2,
                nextCursor: 'nextCursor',
            };

            jest.spyOn(listEmployeePositionServiceMock, 'execute').mockResolvedValueOnce(expectedResult);

            await expect(employeePositionController.listEmployeePosition(actor, payload)).resolves.toEqual(
                expectedResult
            );

            expect(listEmployeePositionServiceMock.execute).toHaveBeenCalledWith({actor, payload});
        });
    });

    describe('when updating an employee position', () => {
        it('should repass the responsibility to the right service', async () => {
            const existingEmployeePosition = EmployeePosition.create({
                companyId,
                name: 'Manager',
                permissions: new Set([RoomPermission.VIEW]),
            });

            const payload: CreateEmployeePosition = {
                companyId,
                name: 'Admin',
                permissions: new Set([RoomPermission.VIEW]),
            };

            const expectedEmployeePosition = new EmployeePositionDto(EmployeePosition.create(payload));

            jest.spyOn(updateEmployeePositionServiceMock, 'execute').mockResolvedValueOnce(expectedEmployeePosition);

            await expect(
                employeePositionController.updateEmployeePosition(actor, existingEmployeePosition.id, payload)
            ).resolves.toEqual(expectedEmployeePosition);

            expect(updateEmployeePositionServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {
                    id: existingEmployeePosition.id,
                    ...payload,
                },
            });
        });
    });
});
