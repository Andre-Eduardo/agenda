import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {PreconditionException} from '../../../../domain/@shared/exceptions';
import {DocumentId, Phone} from '../../../../domain/@shared/value-objects';
import {CompanyId} from '../../../../domain/company/entities';
import type {EventDispatcher} from '../../../../domain/event';
import {PersonId, PersonProfile, PersonType} from '../../../../domain/person/entities';
import {fakePerson} from '../../../../domain/person/entities/__tests__/fake-person';
import {DuplicateDocumentIdException} from '../../../../domain/person/person.exceptions';
import type {PersonRepository} from '../../../../domain/person/person.repository';
import {Supplier} from '../../../../domain/supplier/entities';
import {SupplierCreatedEvent} from '../../../../domain/supplier/events';
import type {SupplierRepository} from '../../../../domain/supplier/supplier.repository';
import {UserId} from '../../../../domain/user/entities';
import type {CreateSupplierDto} from '../../dtos';
import {SupplierDto} from '../../dtos';
import {CreateSupplierService} from '../index';

describe('A create-supplier service', () => {
    const personRepository = mock<PersonRepository>();
    const supplierRepository = mock<SupplierRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const createSupplierService = new CreateSupplierService(personRepository, supplierRepository, eventDispatcher);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should create a supplier', async () => {
        const payload: CreateSupplierDto = {
            name: 'supplier name',
            documentId: DocumentId.create('12345678901'),
            companyId: CompanyId.generate(),
            companyName: 'company name',
            personType: PersonType.LEGAL,
            phone: Phone.create('12345678901'),
        };

        const supplier = Supplier.create(payload);

        jest.spyOn(Supplier, 'create').mockReturnValue(supplier);

        await expect(createSupplierService.execute({actor, payload})).resolves.toEqual(new SupplierDto(supplier));

        expect(Supplier.create).toHaveBeenCalledWith(payload);

        expect(supplier.events[0]).toBeInstanceOf(SupplierCreatedEvent);
        expect(supplier.events).toEqual([
            {
                type: SupplierCreatedEvent.type,
                timestamp: now,
                companyId: supplier.companyId,
                supplier,
            },
        ]);

        expect(supplierRepository.save).toHaveBeenCalledWith(supplier);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, supplier);
    });

    it('should create a supplier from an existing person', async () => {
        const personId = PersonId.generate();
        const payload: CreateSupplierDto = {
            id: personId,
        };
        const person = fakePerson({
            id: personId,
            name: 'name',
            profiles: new Set([PersonProfile.CUSTOMER]),
        });

        const supplier = Supplier.createFromPerson(person);

        jest.spyOn(personRepository, 'findById').mockResolvedValueOnce(person);
        jest.spyOn(Supplier, 'createFromPerson').mockReturnValue(supplier);

        await expect(createSupplierService.execute({actor, payload})).resolves.toEqual(new SupplierDto(supplier));

        expect(supplier.events[0]).toBeInstanceOf(SupplierCreatedEvent);
        expect(supplier.events).toEqual([
            {
                type: SupplierCreatedEvent.type,
                timestamp: now,
                companyId: supplier.companyId,
                supplier,
            },
        ]);

        expect(supplierRepository.save).toHaveBeenCalledWith(supplier);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, supplier);
    });

    it('should fail to create a supplier from a person that is already a supplier', async () => {
        const personId = PersonId.generate();
        const payload: CreateSupplierDto = {
            id: personId,
        };
        const existingPerson = fakePerson({
            id: personId,
            profiles: new Set([PersonProfile.SUPPLIER]),
        });

        jest.spyOn(personRepository, 'findById').mockResolvedValueOnce(existingPerson);

        await expect(createSupplierService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'The person is already a supplier.'
        );
    });

    it('should fail to create a supplier from a person that does not exist', async () => {
        const payload: CreateSupplierDto = {
            id: PersonId.generate(),
        };

        jest.spyOn(personRepository, 'findById').mockResolvedValueOnce(null);

        await expect(createSupplierService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'Person not found'
        );
    });

    it('should fail to create a supplier with a duplicate document ID', async () => {
        const payload: CreateSupplierDto = {
            name: 'supplier name',
            documentId: DocumentId.create('12345678901'),
            companyId: CompanyId.generate(),
            personType: PersonType.LEGAL,
            phone: Phone.create('12345678901'),
        };

        jest.spyOn(supplierRepository, 'save').mockRejectedValue(
            new DuplicateDocumentIdException('Duplicate supplier document ID.')
        );

        await expect(createSupplierService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot create a supplier with a document ID already in use.'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when failing to save the supplier', async () => {
        const payload: CreateSupplierDto = {
            name: 'supplier name',
            documentId: DocumentId.create('12345678901'),
            companyId: CompanyId.generate(),
            personType: PersonType.LEGAL,
            phone: Phone.create('12345678901'),
        };

        jest.spyOn(supplierRepository, 'save').mockRejectedValue(new Error('generic error'));

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
        await expect(createSupplierService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'generic error'
        );
    });
});
