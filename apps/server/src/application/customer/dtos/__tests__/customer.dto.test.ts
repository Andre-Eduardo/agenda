import {DocumentId, Phone} from '../../../../domain/@shared/value-objects';
import {CompanyId} from '../../../../domain/company/entities';
import type {CreateCustomer} from '../../../../domain/customer/entities';
import {Customer} from '../../../../domain/customer/entities';
import {PersonProfile, PersonType} from '../../../../domain/person/entities';
import {CustomerDto} from '../customer.dto';

describe('A customerDto', () => {
    it('should be creatable from a customer entity', () => {
        const customerPayload = {
            name: 'John Doe',
            companyId: CompanyId.generate(),
            companyName: 'ACME',
            documentId: DocumentId.create('123.456.789-00'),
            personType: PersonType.LEGAL,
            phone: Phone.create('61345678900'),
        } satisfies CreateCustomer;

        const customer = Customer.create(customerPayload);
        const customerDto = new CustomerDto(customer);

        expect(customerDto.name).toEqual(customerPayload.name);
        expect(customerDto.documentId).toEqual(customerPayload.documentId.toString());
        expect(customerDto.phone).toEqual(customerPayload.phone.toString());
        expect(customerDto.companyName).toEqual(customerPayload.companyName);
        expect(customerDto.profiles).toEqual([PersonProfile.CUSTOMER]);
        expect(customerDto.personType).toEqual(customerPayload.personType);
    });

    it.each([
        {personType: PersonType.NATURAL, companyName: undefined, gender: null},
        {personType: PersonType.LEGAL, companyName: null, gender: undefined},
    ])('should normalize null values', (values) => {
        const customerPayload: CreateCustomer = {
            ...values,
            name: 'John Doe',
            companyId: CompanyId.generate(),
            documentId: DocumentId.create('123.456.789-00'),
            phone: null,
        };

        const customer = Customer.create(customerPayload);
        const customerDto = new CustomerDto(customer);

        expect(customerDto.companyName).toEqual(null);
        expect(customer.gender).toEqual(null);
        expect(customerDto.phone).toEqual(null);
    });
});
