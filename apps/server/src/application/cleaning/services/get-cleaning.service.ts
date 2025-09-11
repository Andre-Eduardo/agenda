import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {CleaningRepository} from '../../../domain/cleaning/cleaning.repository';
import type {ApplicationService, Command} from '../../@shared/application.service';
import type {GetCleaningDto} from '../dtos';
import {CleaningDto} from '../dtos/cleaning.dto';

@Injectable()
export class GetCleaningService implements ApplicationService<GetCleaningDto, CleaningDto> {
    constructor(private readonly cleaningRepository: CleaningRepository) {}

    async execute({payload}: Command<GetCleaningDto>): Promise<CleaningDto> {
        const cleaning = await this.cleaningRepository.findById(payload.id);

        if (!cleaning) {
            throw new ResourceNotFoundException('Cleaning not found', payload.id.toString());
        }

        return new CleaningDto(cleaning);
    }
}
