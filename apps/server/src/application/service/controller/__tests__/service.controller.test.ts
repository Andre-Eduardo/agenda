import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {CompanyId} from '../../../../domain/company/entities';
import {ServiceId} from '../../../../domain/service/entities';
import {fakeService} from '../../../../domain/service/entities/__tests__/fake-service';
import {ServiceCategoryId} from '../../../../domain/service-category/entities';
import {UserId} from '../../../../domain/user/entities';
import type {PaginatedDto} from '../../../@shared/dto';
import type {CreateServiceDto, ListServiceDto} from '../../dtos';
import {ServiceDto} from '../../dtos';
import type {
    CreateServiceService,
    DeleteServiceService,
    GetServiceService,
    ListServiceService,
    UpdateServiceService,
} from '../../service';
import {ServiceController} from '../service.controller';

describe('A service controller', () => {
    const createServiceService = mock<CreateServiceService>();
    const listServiceService = mock<ListServiceService>();
    const getServiceService = mock<GetServiceService>();
    const updateServiceService = mock<UpdateServiceService>();
    const deleteServiceService = mock<DeleteServiceService>();

    const serviceController = new ServiceController(
        createServiceService,
        listServiceService,
        getServiceService,
        updateServiceService,
        deleteServiceService
    );

    const companyId = CompanyId.generate();
    const categoryId = ServiceCategoryId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    describe('when creating a service', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload: CreateServiceDto = {
                companyId,
                categoryId,
                name: 'Special decorating',
                code: 105,
                price: 299.9,
            };

            const expectedService = new ServiceDto(fakeService(payload));

            jest.spyOn(createServiceService, 'execute').mockResolvedValueOnce(expectedService);

            await expect(serviceController.createService(actor, payload)).resolves.toEqual(expectedService);

            expect(createServiceService.execute).toHaveBeenCalledWith({actor, payload});
            expect(listServiceService.execute).not.toHaveBeenCalled();
            expect(getServiceService.execute).not.toHaveBeenCalled();
            expect(updateServiceService.execute).not.toHaveBeenCalled();
            expect(deleteServiceService.execute).not.toHaveBeenCalled();
        });
    });

    describe('when listing services', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload: ListServiceDto = {
                companyId,
                pagination: {
                    limit: 3,
                },
            };

            const services = [fakeService(), fakeService(), fakeService()];

            const expectedService: PaginatedDto<ServiceDto> = {
                data: services.map((service) => new ServiceDto(service)),
                totalCount: 3,
                nextCursor: 'nextCursor',
            };

            jest.spyOn(listServiceService, 'execute').mockResolvedValueOnce(expectedService);

            await expect(serviceController.listService(actor, payload)).resolves.toEqual(expectedService);

            expect(listServiceService.execute).toHaveBeenCalledWith({actor, payload});
        });
    });

    describe('when getting services', () => {
        it('should repass the responsibility to the right service', async () => {
            const service = fakeService();

            const expectedService = new ServiceDto(service);

            jest.spyOn(getServiceService, 'execute').mockResolvedValueOnce(expectedService);

            await expect(serviceController.getService(actor, service.id)).resolves.toEqual(expectedService);

            expect(getServiceService.execute).toHaveBeenCalledWith({actor, payload: {id: service.id}});
        });
    });

    describe('when updating a service', () => {
        it('should repass the responsibility to the right service', async () => {
            const service = fakeService();

            const payload = {
                name: 'Service new',
            };

            const existingService = new ServiceDto(service);

            jest.spyOn(updateServiceService, 'execute').mockResolvedValueOnce(existingService);

            await expect(serviceController.updateService(actor, service.id, payload)).resolves.toEqual(existingService);

            expect(updateServiceService.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: service.id, ...payload},
            });
        });
    });

    describe('when deleting services', () => {
        it('should repass the responsibility to the right service', async () => {
            const id = ServiceId.generate();

            await serviceController.deleteService(actor, id);

            expect(deleteServiceService.execute).toHaveBeenCalledWith({actor, payload: {id}});
        });
    });
});
