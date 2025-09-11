import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {DefectTypeRepository} from '../../../domain/defect-type/defect-type.repository';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {DeleteDefectTypeDto} from '../dtos';

@Injectable()
export class DeleteDefectTypeService implements ApplicationService<DeleteDefectTypeDto> {
    constructor(
        private readonly defectTypeRepository: DefectTypeRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<DeleteDefectTypeDto>): Promise<void> {
        const defectType = await this.defectTypeRepository.findById(payload.id);

        if (!defectType) {
            throw new ResourceNotFoundException('Defect type not found', payload.id.toString());
        }

        defectType.delete();

        await this.defectTypeRepository.delete(payload.id);

        this.eventDispatcher.dispatch(actor, defectType);
    }
}
