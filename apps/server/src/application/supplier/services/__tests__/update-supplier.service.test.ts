import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {PreconditionException, ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import {DocumentId, Phone} from '../../../../domain/@shared/value-objects';
import {CompanyId} from '../../../../domain/company/entities';
import type {EventDispatcher} from '../../../../domain/event';
import {Gender, PersonId, PersonProfile, PersonType} from '../../../../domain/person/entities';
import {DuplicateDocumentIdException} from '../../../../domain/person/person.exceptions';
import {fakeSupplier} from '../../../../domain/supplier/entities/__tests__/fake-supplier';
import {SupplierChangedEvent} from '../../../../domain/supplier/events';
import type {SupplierRepository} from '../../../../domain/supplier/supplier.repository';
import {UserId} from '../../../../domain/user/entities';
import {SupplierDto, type UpdateSupplierDto} from '../../dtos';
import {UpdateSupplierService} from '../update-supplier.service';

describe('An update-supplier service', () => {
    const supplierRepository = mock<SupplierRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const updateSupplierService = new UpdateSupplierService(supplierRepository, eventDispatcher);

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

    it('should update a supplier', async () => {
        const existingSupplier = fakeSupplier({
            id: PersonId.generate(),
            name: 'old name',
            documentId: DocumentId.create('12345678901'),
            companyName: null,
            profiles: new Set([PersonProfile.EMPLOYEE]),
            personType: PersonType.NATURAL,
            gender: Gender.MALE,
            companyId: CompanyId.generate(),
            phone: Phone.create('12345678901'),
            createdAt: new Date(1000),
            updatedAt: new Date(1000),
        });

        const oldSupplier = fakeSupplier(existingSupplier);

        const payload: UpdateSupplierDto = {
            id: existingSupplier.id,
            name: 'New name',
        };

        jest.spyOn(supplierRepository, 'findById').mockResolvedValueOnce(existingSupplier);

        const updatedSupplier = fakeSupplier({
            ...existingSupplier,
            ...payload,
            updatedAt: now,
        });

        await expect(updateSupplierService.execute({actor, payload})).resolves.toEqual(
            new SupplierDto(updatedSupplier)
        );

        expect(existingSupplier.name).toBe(payload.name);
        expect(existingSupplier.updatedAt).toEqual(now);
        expect(existingSupplier.events).toHaveLength(1);
        expect(existingSupplier.events[0]).toBeInstanceOf(SupplierChangedEvent);
        expect(existingSupplier.events).toEqual([
            {
                type: SupplierChangedEvent.type,
                companyId: existingSupplier.companyId,
                timestamp: now,
                oldState: oldSupplier,
                newState: existingSupplier,
            },
        ]);
        expect(supplierRepository.save).toHaveBeenCalledWith(existingSupplier);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingSupplier);
    });

    it('should fail to update a supplier with a document ID already in use', async () => {
        const existingSupplier = fakeSupplier({
            id: PersonId.generate(),
            name: 'old name',
            documentId: DocumentId.create('12345678901'),
            companyName: null,
            profiles: new Set([PersonProfile.SUPPLIER]),
            personType: PersonType.NATURAL,
            gender: Gender.MALE,
            companyId: CompanyId.generate(),
            phone: Phone.create('12345678901'),
            createdAt: new Date(1000),
            updatedAt: new Date(1000),
        });

        const payload: UpdateSupplierDto = {
            id: existingSupplier.id,
            name: 'supplier name',
            documentId: DocumentId.create('12345678901'),
        };

        jest.spyOn(supplierRepository, 'findById').mockResolvedValueOnce(existingSupplier);
        jest.spyOn(supplierRepository, 'save').mockRejectedValue(
            new DuplicateDocumentIdException('Duplicate supplier document ID.')
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
        await expect(updateSupplierService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot update a supplier with a document ID already in use.'
        );
    });

    it('should throw an error when failing to update the supplier', async () => {
        const existingSupplier = fakeSupplier({
            id: PersonId.generate(),
            name: 'old name',
            documentId: DocumentId.create('12345678901'),
            companyName: null,
            profiles: new Set([PersonProfile.SUPPLIER]),
            personType: PersonType.NATURAL,
            gender: Gender.MALE,
            companyId: CompanyId.generate(),
            phone: Phone.create('12345678901'),
            createdAt: new Date(1000),
            updatedAt: new Date(1000),
        });

        const payload: UpdateSupplierDto = {
            id: existingSupplier.id,
            name: 'supplier name',
            documentId: DocumentId.create('12345678901'),
        };

        jest.spyOn(supplierRepository, 'findById').mockResolvedValueOnce(existingSupplier);
        jest.spyOn(supplierRepository, 'save').mockRejectedValue(new Error('generic error'));

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
        await expect(updateSupplierService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'generic error'
        );
    });

    it('should throw an error when the supplier does not exist', async () => {
        const payload: UpdateSupplierDto = {
            id: PersonId.generate(),
            name: 'New name',
        };

        jest.spyOn(supplierRepository, 'findById').mockResolvedValueOnce(null);

        await expect(updateSupplierService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Supplier not found'
        );
    });
});
