import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import {CompanyId} from '../../../../domain/company/entities';
import type {Service} from '../../../../domain/service/entities';
import {fakeService} from '../../../../domain/service/entities/__tests__/fake-service';
import type {ServiceRepository} from '../../../../domain/service/service.repository';
import {UserId} from '../../../../domain/user/entities';
import type {ListServiceDto} from '../../dtos';
import {ServiceDto} from '../../dtos';
import {ListServiceService} from '../list-service.service';

describe('A list-service service', () => {
    const serviceRepository = mock<ServiceRepository>();
    const listServiceService = new ListServiceService(serviceRepository);

    const companyId = CompanyId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should list services', async () => {
        const existingServices: Service[] = [fakeService(), fakeService()];

        const paginatedServices: PaginatedList<Service> = {
            data: existingServices,
            totalCount: existingServices.length,
            nextCursor: null,
        };

        const payload: ListServiceDto = {
            companyId,
            pagination: {
                limit: 2,
                sort: {name: 'asc'},
            },
            name: 'Name',
        };

        jest.spyOn(serviceRepository, 'search').mockResolvedValueOnce(paginatedServices);

        await expect(listServiceService.execute({actor, payload})).resolves.toEqual({
            data: existingServices.map((service) => new ServiceDto(service)),
            totalCount: existingServices.length,
            nextCursor: null,
        });

        expect(existingServices.flatMap((service) => service.events)).toHaveLength(0);

        expect(serviceRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: 2,
                sort: {name: 'asc'},
            },
            {
                name: 'Name',
            }
        );
    });

    it('should paginate services', async () => {
        const existingServices: Service[] = [fakeService(), fakeService(), fakeService()];

        const paginatedServices: PaginatedList<Service> = {
            data: existingServices,
            totalCount: existingServices.length,
            nextCursor: null,
        };

        const payload: ListServiceDto = {
            companyId,
            pagination: {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 3,
            },
            name: 'Service 3',
        };

        jest.spyOn(serviceRepository, 'search').mockResolvedValueOnce(paginatedServices);

        await expect(listServiceService.execute({actor, payload})).resolves.toEqual({
            data: existingServices.map((service) => new ServiceDto(service)),
            totalCount: existingServices.length,
            nextCursor: null,
        });

        expect(existingServices.flatMap((service) => service.events)).toHaveLength(0);

        expect(serviceRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 3,
                sort: {},
            },
            {
                name: 'Service 3',
            }
        );
    });
});
