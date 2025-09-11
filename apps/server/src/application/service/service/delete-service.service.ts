import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {ServiceRepository} from '../../../domain/service/service.repository';
import type {ApplicationService, Command} from '../../@shared/application.service';
import {DeleteServiceDto} from '../dtos';

@Injectable()
export class DeleteServiceService implements ApplicationService<DeleteServiceDto> {
    constructor(
        private readonly serviceRepository: ServiceRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<DeleteServiceDto>): Promise<void> {
        const service = await this.serviceRepository.findById(payload.id);

        if (!service) {
            throw new ResourceNotFoundException('Service not found', payload.id.toString());
        }

        service.delete();

        await this.serviceRepository.delete(payload.id);

        this.eventDispatcher.dispatch(actor, service);
    }
}
