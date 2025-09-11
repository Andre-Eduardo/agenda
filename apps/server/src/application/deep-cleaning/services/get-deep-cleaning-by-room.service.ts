import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {DeepCleaningRepository} from '../../../domain/deep-cleaning/deep-cleaning.repository';
import type {ApplicationService, Command} from '../../@shared/application.service';
import {DeepCleaningDto} from '../dtos';
import {GetDeepCleaningByRoomDto} from '../dtos/get-deep-cleaning-by-room.dto';

@Injectable()
export class GetDeepCleaningByRoomService implements ApplicationService<GetDeepCleaningByRoomDto, DeepCleaningDto> {
    constructor(private readonly deepCleaningRepository: DeepCleaningRepository) {}

    async execute({payload}: Command<GetDeepCleaningByRoomDto>): Promise<DeepCleaningDto> {
        const deepCleaning = await this.deepCleaningRepository.findByRoom(payload.roomId);

        if (!deepCleaning) {
            throw new ResourceNotFoundException('Deep cleaning not found in room', payload.roomId.toString());
        }

        return new DeepCleaningDto(deepCleaning);
    }
}
