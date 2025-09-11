import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {ServiceCategoryRepository} from '../../../domain/service-category/service-category.repository';
import type {ApplicationService, Command} from '../../@shared/application.service';
import {GetServiceCategoryDto, ServiceCategoryDto} from '../dtos';

@Injectable()
export class GetServiceCategoryService implements ApplicationService<GetServiceCategoryDto, ServiceCategoryDto> {
    constructor(private readonly serviceCategoryRepository: ServiceCategoryRepository) {}

    async execute({payload}: Command<GetServiceCategoryDto>): Promise<ServiceCategoryDto> {
        const serviceCategory = await this.serviceCategoryRepository.findById(payload.id);

        if (serviceCategory === null) {
            throw new ResourceNotFoundException('Service category not found', payload.id.toString());
        }

        return new ServiceCategoryDto(serviceCategory);
    }
}
