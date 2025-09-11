import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {ServiceRepository} from '../../../domain/service/service.repository';
import type {ApplicationService, Command} from '../../@shared/application.service';
import {GetServiceDto, ServiceDto} from '../dtos';

@Injectable()
export class GetServiceService implements ApplicationService<GetServiceDto, ServiceDto> {
    constructor(private readonly serviceRepository: ServiceRepository) {}

    async execute({payload}: Command<GetServiceDto>): Promise<ServiceDto> {
        const service = await this.serviceRepository.findById(payload.id);

        if (!service) {
            throw new ResourceNotFoundException('Service not found', payload.id.toString());
        }

        return new ServiceDto(service);
    }
}
