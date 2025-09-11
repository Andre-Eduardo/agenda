import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import {CompanyId} from '../../../../domain/company/entities';
import type {EmployeePositionRepository} from '../../../../domain/employee-position/employee-position.repository';
import type {EmployeePosition} from '../../../../domain/employee-position/entities';
import {fakeEmployeePosition} from '../../../../domain/employee-position/entities/__tests__/fake-employee-position';
import {UserId} from '../../../../domain/user/entities';
import type {ListEmployeePositionDto} from '../../dtos';
import {EmployeePositionDto} from '../../dtos';
import {ListEmployeePositionService} from '../list-employee-position.service';

describe('A list-employee-position service', () => {
    const employeePositionRepository = mock<EmployeePositionRepository>();
    const listEmployeePositionService = new ListEmployeePositionService(employeePositionRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should list employee positions', async () => {
        const companyId = CompanyId.generate();

        const existingEmployeePositions: EmployeePosition[] = [
            fakeEmployeePosition({
                companyId,
                name: 'Manager',
            }),
            fakeEmployeePosition({
                companyId,
                name: 'Admin',
            }),
            fakeEmployeePosition({
                companyId,
                name: 'Maid',
            }),
            fakeEmployeePosition({
                companyId,
                name: 'receptionist',
            }),
        ];

        const paginatedEmployeePositions: PaginatedList<EmployeePosition> = {
            data: existingEmployeePositions,
            totalCount: existingEmployeePositions.length,
            nextCursor: null,
        };

        const payload: ListEmployeePositionDto = {
            companyId,
            pagination: {
                limit: 4,
                sort: {name: 'asc'},
            },
        };

        jest.spyOn(employeePositionRepository, 'search').mockResolvedValueOnce(paginatedEmployeePositions);

        await expect(listEmployeePositionService.execute({actor, payload})).resolves.toEqual({
            data: existingEmployeePositions.map((employeePosition) => new EmployeePositionDto(employeePosition)),
            totalCount: existingEmployeePositions.length,
            nextCursor: null,
        });

        expect(existingEmployeePositions.flatMap((employeePosition) => employeePosition.events)).toHaveLength(0);

        expect(employeePositionRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: 4,
                sort: {name: 'asc'},
            },
            {
                name: undefined,
            }
        );
    });

    it('should paginate employee positions', async () => {
        const companyId = CompanyId.generate();

        const existingEmployeePositions: EmployeePosition[] = [
            fakeEmployeePosition({
                companyId,
                name: 'Manager',
            }),
            fakeEmployeePosition({
                companyId,
                name: 'Admin 1',
            }),
            fakeEmployeePosition({
                companyId,
                name: 'Admin 2',
            }),
            fakeEmployeePosition({
                companyId,
                name: 'Admin 3',
            }),
        ];

        const paginatedEmployeePositions: PaginatedList<EmployeePosition> = {
            data: existingEmployeePositions,
            totalCount: existingEmployeePositions.length,
            nextCursor: null,
        };

        const payload: ListEmployeePositionDto = {
            companyId,
            pagination: {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 3,
            },
            name: 'Admin',
        };

        jest.spyOn(employeePositionRepository, 'search').mockResolvedValueOnce(paginatedEmployeePositions);

        await expect(listEmployeePositionService.execute({actor, payload})).resolves.toEqual({
            data: existingEmployeePositions.map((employeePosition) => new EmployeePositionDto(employeePosition)),
            totalCount: existingEmployeePositions.length,
            nextCursor: null,
        });

        expect(existingEmployeePositions.flatMap((employeePosition) => employeePosition.events)).toHaveLength(0);

        expect(employeePositionRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 3,
                sort: {},
            },
            {
                name: 'Admin',
            }
        );
    });
});
