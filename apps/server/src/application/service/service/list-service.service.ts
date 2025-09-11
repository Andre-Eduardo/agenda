import {Injectable} from '@nestjs/common';
import {ServiceRepository} from '../../../domain/service/service.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {ListServiceDto, ServiceDto} from '../dtos';

@Injectable()
export class ListServiceService implements ApplicationService<ListServiceDto, PaginatedDto<ServiceDto>> {
    constructor(private serviceRepository: ServiceRepository) {}

    async execute({payload}: Command<ListServiceDto>): Promise<PaginatedDto<ServiceDto>> {
        const result = await this.serviceRepository.search(
            payload.companyId,
            {
                cursor: payload.pagination.cursor ?? undefined,
                limit: payload.pagination.limit,
                sort: payload.pagination.sort ?? {},
            },
            {
                name: payload.name,
                categoryId: payload.categoryId,
                code: payload.code,
                price: payload.price,
            }
        );

        return {
            ...result,
            data: result.data.map((service) => new ServiceDto(service)),
        };
    }
}
