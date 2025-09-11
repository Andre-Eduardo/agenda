import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {DefectRepository} from '../../../domain/defect/defect.repository';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {DeleteDefectDto} from '../dtos';

@Injectable()
export class DeleteDefectService implements ApplicationService<DeleteDefectDto> {
    constructor(
        private readonly defectRepository: DefectRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<DeleteDefectDto>): Promise<void> {
        const defect = await this.defectRepository.findById(payload.id);

        if (!defect) {
            throw new ResourceNotFoundException('Defect not found', payload.id.toString());
        }

        defect.delete();

        await this.defectRepository.delete(payload.id);

        this.eventDispatcher.dispatch(actor, defect);
    }
}
