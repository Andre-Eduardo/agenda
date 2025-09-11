import {Injectable} from '@nestjs/common';
import {
    DuplicateNameException,
    PreconditionException,
    ResourceNotFoundException,
} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {ServiceCategoryRepository} from '../../../domain/service-category/service-category.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {ServiceCategoryDto, UpdateServiceCategoryDto} from '../dtos';

@Injectable()
export class UpdateServiceCategoryService implements ApplicationService<UpdateServiceCategoryDto, ServiceCategoryDto> {
    constructor(
        private readonly serviceCategoryRepository: ServiceCategoryRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<UpdateServiceCategoryDto>): Promise<ServiceCategoryDto> {
        const serviceCategory = await this.serviceCategoryRepository.findById(payload.id);

        if (serviceCategory === null) {
            throw new ResourceNotFoundException('Service category not found', payload.id.toString());
        }

        serviceCategory.change(payload);

        try {
            await this.serviceCategoryRepository.save(serviceCategory);
        } catch (e) {
            if (e instanceof DuplicateNameException) {
                throw new PreconditionException('Cannot update a service category with a name already in use.');
            }

            throw e;
        }

        this.eventDispatcher.dispatch(actor, serviceCategory);

        return new ServiceCategoryDto(serviceCategory);
    }
}
