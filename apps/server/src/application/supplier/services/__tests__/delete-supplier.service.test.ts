import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {EventDispatcher} from '../../../../domain/event';
import {PersonId, PersonProfile} from '../../../../domain/person/entities';
import {fakePerson} from '../../../../domain/person/entities/__tests__/fake-person';
import type {PersonRepository} from '../../../../domain/person/person.repository';
import {fakeSupplier} from '../../../../domain/supplier/entities/__tests__/fake-supplier';
import {SupplierDeletedEvent} from '../../../../domain/supplier/events';
import type {SupplierRepository} from '../../../../domain/supplier/supplier.repository';
import {UserId} from '../../../../domain/user/entities';
import type {DeleteSupplierDto} from '../../dtos';
import {DeleteSupplierService} from '../delete-supplier.service';

describe('A delete-supplier service', () => {
    const supplierRepository = mock<SupplierRepository>();
    const personRepository = mock<PersonRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const deleteSupplierService = new DeleteSupplierService(personRepository, supplierRepository, eventDispatcher);

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

    it('should delete a supplier', async () => {
        const existingPerson = fakePerson({
            profiles: new Set([PersonProfile.EMPLOYEE, PersonProfile.SUPPLIER]),
        });

        const existingSupplier = fakeSupplier({
            ...existingPerson,
            createdAt: now,
            updatedAt: now,
        });

        const payload: DeleteSupplierDto = {
            id: existingSupplier.id,
        };

        jest.spyOn(supplierRepository, 'findById').mockResolvedValueOnce(existingSupplier);

        await deleteSupplierService.execute({actor, payload});

        expect(existingSupplier.events).toHaveLength(1);
        expect(existingSupplier.events[0]).toBeInstanceOf(SupplierDeletedEvent);
        expect(existingSupplier.events).toEqual([
            {
                type: SupplierDeletedEvent.type,
                timestamp: now,
                companyId: existingSupplier.companyId,
                supplier: existingSupplier,
            },
        ]);
        expect(supplierRepository.save).toHaveBeenCalledWith({
            ...existingSupplier,
            profiles: new Set([PersonProfile.EMPLOYEE]),
        });
        expect(supplierRepository.delete).toHaveBeenCalledWith(existingSupplier.id);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingSupplier);
    });

    it('should delete a person who is a supplier only', async () => {
        const existingPerson = fakePerson({
            profiles: new Set([PersonProfile.SUPPLIER]),
        });

        const existingSupplier = fakeSupplier({
            ...existingPerson,
            createdAt: now,
            updatedAt: now,
        });

        const payload: DeleteSupplierDto = {
            id: existingSupplier.id,
        };

        jest.spyOn(supplierRepository, 'findById').mockResolvedValueOnce(existingSupplier);

        await deleteSupplierService.execute({actor, payload});

        expect(existingSupplier.events).toHaveLength(1);
        expect(existingSupplier.events[0]).toBeInstanceOf(SupplierDeletedEvent);
        expect(existingSupplier.events).toEqual([
            {
                type: SupplierDeletedEvent.type,
                timestamp: now,
                companyId: existingSupplier.companyId,
                supplier: existingSupplier,
            },
        ]);
        expect(supplierRepository.save).toHaveBeenCalledWith({
            ...existingSupplier,
            profiles: new Set([]),
        });
        expect(supplierRepository.delete).toHaveBeenCalledWith(existingSupplier.id);
        expect(personRepository.delete).toHaveBeenCalledWith(existingSupplier.id);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingSupplier);
    });

    it('should throw an error when the supplier does not exist', async () => {
        const personId = PersonId.generate();
        const payload: DeleteSupplierDto = {
            id: personId,
        };

        jest.spyOn(supplierRepository, 'findById').mockResolvedValueOnce(null);

        await expect(deleteSupplierService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Supplier not found'
        );
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
