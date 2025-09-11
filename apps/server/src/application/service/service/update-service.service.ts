import {Injectable} from '@nestjs/common';
import {
    DuplicateNameException,
    PreconditionException,
    ResourceNotFoundException,
} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {DuplicateCodeException} from '../../../domain/service/service.exception';
import {ServiceRepository} from '../../../domain/service/service.repository';
import type {ApplicationService, Command} from '../../@shared/application.service';
import {ServiceDto, UpdateServiceDto} from '../dtos';

@Injectable()
export class UpdateServiceService implements ApplicationService<UpdateServiceDto, ServiceDto> {
    constructor(
        readonly serviceRepository: ServiceRepository,
        readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<UpdateServiceDto>): Promise<ServiceDto> {
        const service = await this.serviceRepository.findById(payload.id);

        if (!service) {
            throw new ResourceNotFoundException('Service not found', payload.id.toString());
        }

        service.change(payload);

        try {
            await this.serviceRepository.save(service);
        } catch (e) {
            if (e instanceof DuplicateNameException) {
                throw new PreconditionException('Cannot update service with a name already in use.', e);
            }

            if (e instanceof DuplicateCodeException) {
                throw new PreconditionException('Cannot update a service with a code already in use.', e);
            }

            throw e;
        }

        this.eventDispatcher.dispatch(actor, service);

        return new ServiceDto(service);
    }
}
