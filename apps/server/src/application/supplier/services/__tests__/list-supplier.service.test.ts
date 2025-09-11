import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import {DocumentId} from '../../../../domain/@shared/value-objects';
import {CompanyId} from '../../../../domain/company/entities';
import {Gender, PersonId, PersonType} from '../../../../domain/person/entities';
import type {Supplier} from '../../../../domain/supplier/entities';
import {fakeSupplier} from '../../../../domain/supplier/entities/__tests__/fake-supplier';
import type {SupplierRepository} from '../../../../domain/supplier/supplier.repository';
import {UserId} from '../../../../domain/user/entities';
import type {ListSupplierDto} from '../../dtos';
import {SupplierDto} from '../../dtos';
import {ListSupplierService} from '../list-supplier.service';

describe('A list-supplier service', () => {
    const supplierRepository = mock<SupplierRepository>();
    const listSupplierService = new ListSupplierService(supplierRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const companyId = CompanyId.generate();
    const existingSupplier = [
        fakeSupplier({
            name: 'My name',
            personType: PersonType.NATURAL,
            documentId: DocumentId.create('12345678911'),
            gender: Gender.MALE,
            companyId,
        }),
        fakeSupplier({
            id: PersonId.generate(),
            name: 'My name2',
            documentId: DocumentId.create('12345678901'),
            personType: PersonType.NATURAL,
            gender: Gender.FEMALE,
            companyId,
        }),
    ];

    it('should list suppliers', async () => {
        const paginatedSuppliers: PaginatedList<Supplier> = {
            data: existingSupplier,
            totalCount: existingSupplier.length,
            nextCursor: null,
        };

        const payload: ListSupplierDto = {
            companyId,
            pagination: {
                limit: 2,
                sort: {name: 'asc'},
            },
            name: 'name',
        };

        jest.spyOn(supplierRepository, 'search').mockResolvedValueOnce(paginatedSuppliers);

        await expect(listSupplierService.execute({actor, payload})).resolves.toEqual({
            data: existingSupplier.map((supplier) => new SupplierDto(supplier)),
            totalCount: existingSupplier.length,
            nextCursor: null,
        });
        expect(existingSupplier.flatMap((supplier) => supplier.events)).toHaveLength(0);
        expect(supplierRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: 2,
                sort: {name: 'asc'},
            },
            {
                name: 'name',
            }
        );
    });

    it('should paginate suppliers', async () => {
        const paginatedSuppliers: PaginatedList<Supplier> = {
            data: existingSupplier,
            totalCount: existingSupplier.length,
            nextCursor: null,
        };
        const payload: ListSupplierDto = {
            companyId,
            name: 'name',
            pagination: {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
            },
        };

        jest.spyOn(supplierRepository, 'search').mockResolvedValueOnce(paginatedSuppliers);

        await expect(listSupplierService.execute({actor, payload})).resolves.toEqual({
            data: existingSupplier.map((supplier) => new SupplierDto(supplier)),
            totalCount: existingSupplier.length,
            nextCursor: null,
        });
        expect(existingSupplier.flatMap((supplier) => supplier.events)).toHaveLength(0);
        expect(supplierRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
                sort: {},
            },
            {
                name: 'name',
            }
        );
    });
});
