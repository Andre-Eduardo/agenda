import {DocumentId, Phone} from '../../../../domain/@shared/value-objects';
import {CompanyId} from '../../../../domain/company/entities';
import {PersonProfile, PersonType} from '../../../../domain/person/entities';
import type {CreateSupplier} from '../../../../domain/supplier/entities';
import {Supplier} from '../../../../domain/supplier/entities';
import {SupplierDto} from '../supplier.dto';

describe('A supplierDto', () => {
    it('should be creatable from a supplier entity', () => {
        const supplierPayload = {
            name: 'John Doe',
            companyId: CompanyId.generate(),
            companyName: 'ACME',
            documentId: DocumentId.create('123.456.789-00'),
            personType: PersonType.LEGAL,
            phone: Phone.create('61345678900'),
        } satisfies CreateSupplier;

        const supplier = Supplier.create(supplierPayload);
        const supplierDto = new SupplierDto(supplier);

        expect(supplierDto.name).toEqual(supplierPayload.name);
        expect(supplierDto.documentId).toEqual(supplierPayload.documentId.toString());
        expect(supplierDto.phone).toEqual(supplierPayload.phone.toString());
        expect(supplierDto.companyName).toEqual(supplierPayload.companyName);
        expect(supplierDto.profiles).toEqual([PersonProfile.SUPPLIER]);
        expect(supplierDto.personType).toEqual(supplierPayload.personType);
    });

    it.each([
        {personType: PersonType.NATURAL, companyName: undefined, gender: null},
        {personType: PersonType.LEGAL, companyName: null, gender: undefined},
    ])('should normalize null values', (values) => {
        const supplierPayload: CreateSupplier = {
            ...values,
            name: 'John Doe',
            companyId: CompanyId.generate(),
            documentId: DocumentId.create('123.456.789-00'),
            phone: null,
        };

        const supplier = Supplier.create(supplierPayload);
        const supplierDto = new SupplierDto(supplier);

        expect(supplierDto.companyName).toEqual(null);
        expect(supplier.gender).toEqual(null);
        expect(supplierDto.phone).toEqual(null);
    });
});
