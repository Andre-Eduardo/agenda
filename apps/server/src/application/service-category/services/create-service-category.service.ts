import {Injectable} from '@nestjs/common';
import {DuplicateNameException, PreconditionException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {ServiceCategory} from '../../../domain/service-category/entities';
import {ServiceCategoryRepository} from '../../../domain/service-category/service-category.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CreateServiceCategoryDto, ServiceCategoryDto} from '../dtos';

@Injectable()
export class CreateServiceCategoryService implements ApplicationService<CreateServiceCategoryDto, ServiceCategoryDto> {
    constructor(
        private readonly serviceCategoryRepository: ServiceCategoryRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreateServiceCategoryDto>): Promise<ServiceCategoryDto> {
        const serviceCategory = ServiceCategory.create(payload);

        try {
            await this.serviceCategoryRepository.save(serviceCategory);
        } catch (e) {
            if (e instanceof DuplicateNameException) {
                throw new PreconditionException('Cannot create a service category with a name already in use.');
            }

            throw e;
        }

        this.eventDispatcher.dispatch(actor, serviceCategory);

        return new ServiceCategoryDto(serviceCategory);
    }
}
