import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {DocumentId, Phone} from '../../../../domain/@shared/value-objects';
import {CompanyId} from '../../../../domain/company/entities';
import {PersonProfile, PersonType} from '../../../../domain/person/entities';
import {Supplier} from '../../../../domain/supplier/entities';
import {UserId} from '../../../../domain/user/entities';
import type {PaginatedDto} from '../../../@shared/dto';
import {SupplierDto} from '../../dtos';
import type {
    CreateSupplierService,
    DeleteSupplierService,
    GetSupplierService,
    ListSupplierService,
    UpdateSupplierService,
} from '../../services';
import {SupplierController} from '../supplier.controller';

describe('A supplier controller', () => {
    const createSupplierServiceMock = mock<CreateSupplierService>();
    const getSupplierServiceMock = mock<GetSupplierService>();
    const listSupplierServiceMock = mock<ListSupplierService>();
    const deleteSupplierServiceMock = mock<DeleteSupplierService>();
    const updateSupplierServiceMock = mock<UpdateSupplierService>();
    const supplierController = new SupplierController(
        createSupplierServiceMock,
        listSupplierServiceMock,
        getSupplierServiceMock,
        updateSupplierServiceMock,
        deleteSupplierServiceMock
    );

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    describe('when creating a supplier', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload = {
                name: 'name',
                companyId: CompanyId.generate(),
                phone: Phone.create('61999999999'),
                companyName: 'ACME',
                personType: PersonType.LEGAL,
                documentId: DocumentId.create('15785065178'),
            };

            const expectedSupplier = new SupplierDto(Supplier.create(payload));

            jest.spyOn(createSupplierServiceMock, 'execute').mockResolvedValueOnce(expectedSupplier);

            await expect(supplierController.createSupplier(actor, payload)).resolves.toEqual(expectedSupplier);

            expect(createSupplierServiceMock.execute).toHaveBeenCalledWith({actor, payload});
            expect(getSupplierServiceMock.execute).not.toHaveBeenCalled();
            expect(listSupplierServiceMock.execute).not.toHaveBeenCalled();
            expect(deleteSupplierServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when getting a supplier', () => {
        it('should repass the responsibility to the right service', async () => {
            const supplier = Supplier.create({
                name: 'name',
                documentId: DocumentId.create('15785065178'),
                companyId: CompanyId.generate(),
                companyName: 'ACME',
                personType: PersonType.LEGAL,
                phone: Phone.create('61999999999'),
                gender: null,
            });

            const expectedSupplier = new SupplierDto(supplier);

            jest.spyOn(getSupplierServiceMock, 'execute').mockResolvedValueOnce(expectedSupplier);

            await expect(supplierController.getSupplier(actor, supplier.id)).resolves.toEqual(expectedSupplier);

            expect(getSupplierServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id: supplier.id}});
        });
    });

    describe('when listing a supplier', () => {
        it('should repass the responsibility to the right service', async () => {
            const companyId = CompanyId.generate();
            const values = [
                {
                    name: 'name',
                    documentId: DocumentId.create('15785065178'),
                    companyId,
                    companyName: 'company',
                    profiles: [PersonProfile.SUPPLIER],
                    personType: PersonType.LEGAL,
                    phone: Phone.create('61999999999'),
                },
                {
                    name: 'name 2',
                    documentId: DocumentId.create('15785065178'),
                    companyId,
                    companyName: 'company 2',
                    profiles: [PersonProfile.SUPPLIER],
                    personType: PersonType.LEGAL,
                    phone: Phone.create('61999999999'),
                },
            ];

            const payload = {
                companyId,
                name: 'name',
                pagination: {
                    limit: 10,
                },
            };

            const suppliers = [Supplier.create(values[0]), Supplier.create(values[1])];
            const expectedResult: PaginatedDto<SupplierDto> = {
                data: suppliers.map((supplier) => new SupplierDto(supplier)),
                totalCount: 2,
                nextCursor: null,
            };

            jest.spyOn(listSupplierServiceMock, 'execute').mockResolvedValueOnce(expectedResult);

            await expect(supplierController.listSupplier(actor, payload)).resolves.toEqual(expectedResult);

            expect(listSupplierServiceMock.execute).toHaveBeenCalledWith({actor, payload});
        });
    });

    describe('when updating a supplier', () => {
        it('should repass the responsibility to the right service', async () => {
            const existingSupplier = Supplier.create({
                name: 'name',
                documentId: DocumentId.create('15785065178'),
                companyId: CompanyId.generate(),
                companyName: 'ACME',
                personType: PersonType.LEGAL,
                phone: Phone.create('61999999999'),
            });
            const payload = {
                name: 'name',
            };

            const expectedSupplier = new SupplierDto(existingSupplier);

            jest.spyOn(updateSupplierServiceMock, 'execute').mockResolvedValueOnce(expectedSupplier);

            await expect(supplierController.updateSupplier(actor, existingSupplier.id, payload)).resolves.toEqual(
                expectedSupplier
            );

            expect(updateSupplierServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: existingSupplier.id, ...payload},
            });
        });
    });

    describe('when delete a supplier', () => {
        it('should repass the responsibility to the right service', async () => {
            const supplier = Supplier.create({
                name: 'name',
                documentId: DocumentId.create('15785065178'),
                companyId: CompanyId.generate(),
                companyName: 'ACME',
                personType: PersonType.LEGAL,
                phone: Phone.create('61999999999'),
            });

            await supplierController.deleteSupplier(actor, supplier.id);

            expect(createSupplierServiceMock.execute).not.toHaveBeenCalled();
            expect(getSupplierServiceMock.execute).not.toHaveBeenCalled();
            expect(listSupplierServiceMock.execute).not.toHaveBeenCalled();
            expect(deleteSupplierServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id: supplier.id}});
        });
    });
});
