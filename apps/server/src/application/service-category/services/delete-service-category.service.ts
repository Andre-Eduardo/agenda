import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {ServiceCategoryRepository} from '../../../domain/service-category/service-category.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {DeleteServiceCategoryDto} from '../dtos';

@Injectable()
export class DeleteServiceCategoryService implements ApplicationService<DeleteServiceCategoryDto> {
    constructor(
        private readonly serviceCategoryRepository: ServiceCategoryRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<DeleteServiceCategoryDto>): Promise<void> {
        const serviceCategory = await this.serviceCategoryRepository.findById(payload.id);

        if (serviceCategory === null) {
            throw new ResourceNotFoundException('Service category not found', payload.id.toString());
        }

        serviceCategory.delete();

        await this.serviceCategoryRepository.delete(payload.id);
        this.eventDispatcher.dispatch(actor, serviceCategory);
    }
}
