import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {InspectionRepository} from '../../../domain/inspection/inspection.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {GetInspectionByRoomDto, InspectionDto} from '../dtos';

@Injectable()
export class GetInspectionByRoomService implements ApplicationService<GetInspectionByRoomDto, InspectionDto> {
    constructor(private readonly inspectionRepository: InspectionRepository) {}

    async execute({payload}: Command<GetInspectionByRoomDto>): Promise<InspectionDto> {
        const inspection = await this.inspectionRepository.findByRoom(payload.id);

        if (!inspection) {
            throw new ResourceNotFoundException('Inspection not found for the room', payload.id.toString());
        }

        return new InspectionDto(inspection);
    }
}
