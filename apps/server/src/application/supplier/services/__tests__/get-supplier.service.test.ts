import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import {PersonId} from '../../../../domain/person/entities';
import {fakeSupplier} from '../../../../domain/supplier/entities/__tests__/fake-supplier';
import type {SupplierRepository} from '../../../../domain/supplier/supplier.repository';
import {UserId} from '../../../../domain/user/entities';
import type {GetSupplierDto} from '../../dtos';
import {SupplierDto} from '../../dtos';
import {GetSupplierService} from '../get-supplier.service';

describe('A get-supplier service', () => {
    const supplierRepository = mock<SupplierRepository>();
    const getSupplierService = new GetSupplierService(supplierRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should get a supplier', async () => {
        const existingSupplier = fakeSupplier();

        const payload: GetSupplierDto = {
            id: existingSupplier.id,
        };

        jest.spyOn(supplierRepository, 'findById').mockResolvedValueOnce(existingSupplier);

        await expect(getSupplierService.execute({actor, payload})).resolves.toEqual(new SupplierDto(existingSupplier));

        expect(existingSupplier.events).toHaveLength(0);

        expect(supplierRepository.findById).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the supplier does not exist', async () => {
        const payload: GetSupplierDto = {
            id: PersonId.generate(),
        };

        jest.spyOn(supplierRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getSupplierService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Supplier not found'
        );
    });
});
