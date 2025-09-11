import {CashierPermission, RoomPermission} from '../../../auth';
import {CompanyId} from '../../../company/entities';
import {EmployeePosition, EmployeePositionId} from '../employee-position.entity';

export function fakeEmployeePosition(payload: Partial<EmployeePosition> = {}): EmployeePosition {
    return new EmployeePosition({
        id: EmployeePositionId.generate(),
        companyId: CompanyId.generate(),
        name: 'Employee Position',
        permissions: new Set([RoomPermission.VIEW, RoomPermission.UPDATE, CashierPermission.OPEN]),
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        ...payload,
    });
}
