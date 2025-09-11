import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {InspectionRepository} from '../../../domain/inspection/inspection.repository';
import type {ApplicationService, Command} from '../../@shared/application.service';
import {GetInspectionDto, InspectionDto} from '../dtos';

@Injectable()
export class GetInspectionService implements ApplicationService<GetInspectionDto, InspectionDto> {
    constructor(private readonly inspectionRepository: InspectionRepository) {}

    async execute({payload}: Command<GetInspectionDto>): Promise<InspectionDto> {
        const inspection = await this.inspectionRepository.findById(payload.id);

        if (!inspection) {
            throw new ResourceNotFoundException('Inspection not found', payload.id.toString());
        }

        return new InspectionDto(inspection);
    }
}
