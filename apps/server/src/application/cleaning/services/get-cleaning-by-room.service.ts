import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {CleaningRepository} from '../../../domain/cleaning/cleaning.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {GetCleaningByRoomDto} from '../dtos';
import {CleaningDto} from '../dtos/cleaning.dto';

@Injectable()
export class GetCleaningByRoomService implements ApplicationService<GetCleaningByRoomDto, CleaningDto> {
    constructor(private readonly cleaningRepository: CleaningRepository) {}

    async execute({payload}: Command<GetCleaningByRoomDto>): Promise<CleaningDto> {
        const cleaning = await this.cleaningRepository.findByRoom(payload.roomId);

        if (!cleaning) {
            throw new ResourceNotFoundException('Cleaning not found in room', payload.roomId.toString());
        }

        return new CleaningDto(cleaning);
    }
}
