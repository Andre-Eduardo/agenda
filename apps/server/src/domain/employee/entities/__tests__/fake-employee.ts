import {DocumentId, Phone} from '../../../@shared/value-objects';
import {CompanyId} from '../../../company/entities';
import {EmployeePositionId} from '../../../employee-position/entities';
import {PersonId, PersonProfile, PersonType} from '../../../person/entities';
import {UserId} from '../../../user/entities';
import {Employee} from '../index';

export function fakeEmployee(payload: Partial<Employee> = {}): Employee {
    return new Employee({
        id: PersonId.generate(),
        name: 'Employee',
        userId: UserId.generate(),
        companyId: CompanyId.generate(),
        companyName: null,
        personType: PersonType.NATURAL,
        profiles: new Set([PersonProfile.EMPLOYEE]),
        documentId: DocumentId.create('12345678901'),
        positionId: EmployeePositionId.generate(),
        phone: Phone.create('12345678901'),
        gender: null,
        allowSystemAccess: false,
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        ...payload,
    });
}
