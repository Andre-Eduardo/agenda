import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {DefectRepository} from '../../../domain/defect/defect.repository';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {DefectDto, UpdateDefectDto} from '../dtos';

@Injectable()
export class UpdateDefectService implements ApplicationService<UpdateDefectDto, DefectDto> {
    constructor(
        private readonly defectRepository: DefectRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<UpdateDefectDto>): Promise<DefectDto> {
        const defect = await this.defectRepository.findById(payload.id);

        if (!defect) {
            throw new ResourceNotFoundException('Defect not found', payload.id.toString());
        }

        defect.change(payload);

        await this.defectRepository.save(defect);

        this.eventDispatcher.dispatch(actor, defect);

        return new DefectDto(defect);
    }
}
