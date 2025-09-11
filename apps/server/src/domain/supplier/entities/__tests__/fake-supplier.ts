import {DocumentId, Phone} from '../../../@shared/value-objects';
import {CompanyId} from '../../../company/entities';
import {PersonId, PersonProfile, PersonType} from '../../../person/entities';
import {Supplier} from '../supplier.entity';

export function fakeSupplier(payload: Partial<Supplier> = {}): Supplier {
    return new Supplier({
        id: PersonId.generate(),
        name: 'Supplier',
        companyId: CompanyId.generate(),
        companyName: null,
        personType: PersonType.LEGAL,
        profiles: new Set([PersonProfile.SUPPLIER]),
        documentId: DocumentId.create('12345678901'),
        phone: Phone.create('12345678901'),
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        ...payload,
    });
}
