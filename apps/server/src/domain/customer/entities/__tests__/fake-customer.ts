import {DocumentId, Phone} from '../../../@shared/value-objects';
import {CompanyId} from '../../../company/entities';
import {PersonId, PersonProfile, PersonType} from '../../../person/entities';
import {Customer} from '../customer.entity';

export function fakeCustomer(payload: Partial<Customer> = {}): Customer {
    return new Customer({
        id: PersonId.generate(),
        name: 'Customer',
        companyId: CompanyId.generate(),
        companyName: null,
        personType: PersonType.NATURAL,
        profiles: new Set([PersonProfile.CUSTOMER]),
        documentId: DocumentId.create('12345678901'),
        phone: Phone.create('12345678901'),
        gender: null,
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        ...payload,
    });
}
