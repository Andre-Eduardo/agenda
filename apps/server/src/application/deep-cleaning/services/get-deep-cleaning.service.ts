import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {DeepCleaningRepository} from '../../../domain/deep-cleaning/deep-cleaning.repository';
import type {ApplicationService, Command} from '../../@shared/application.service';
import {DeepCleaningDto, GetDeepCleaningDto} from '../dtos';

@Injectable()
export class GetDeepCleaningService implements ApplicationService<GetDeepCleaningDto, DeepCleaningDto> {
    constructor(private readonly deepCleaningRepository: DeepCleaningRepository) {}

    async execute({payload}: Command<GetDeepCleaningDto>): Promise<DeepCleaningDto> {
        const deepCleaning = await this.deepCleaningRepository.findById(payload.id);

        if (!deepCleaning) {
            throw new ResourceNotFoundException('Deep cleaning not found', payload.id.toString());
        }

        return new DeepCleaningDto(deepCleaning);
    }
}
