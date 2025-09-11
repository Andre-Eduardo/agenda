import {Injectable} from '@nestjs/common';
import {DuplicateNameException, PreconditionException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {Service} from '../../../domain/service/entities';
import {DuplicateCodeException} from '../../../domain/service/service.exception';
import {ServiceRepository} from '../../../domain/service/service.repository';
import type {ApplicationService, Command} from '../../@shared/application.service';
import {CreateServiceDto, ServiceDto} from '../dtos';

@Injectable()
export class CreateServiceService implements ApplicationService<CreateServiceDto, ServiceDto> {
    constructor(
        private readonly serviceRepository: ServiceRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreateServiceDto>): Promise<ServiceDto> {
        const service = Service.create(payload);

        try {
            await this.serviceRepository.save(service);
        } catch (e) {
            if (e instanceof DuplicateNameException) {
                throw new PreconditionException('Cannot create a service with a name already in use.');
            }

            if (e instanceof DuplicateCodeException) {
                throw new PreconditionException('Cannot create a service with a code already in use.');
            }

            throw e;
        }

        this.eventDispatcher.dispatch(actor, service);

        return new ServiceDto(service);
    }
}
