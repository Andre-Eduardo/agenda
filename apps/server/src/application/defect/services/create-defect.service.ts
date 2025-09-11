import {Injectable} from '@nestjs/common';
import {DefectRepository} from '../../../domain/defect/defect.repository';
import {Defect} from '../../../domain/defect/entities';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CreateDefectDto, DefectDto} from '../dtos';

@Injectable()
export class CreateDefectService implements ApplicationService<CreateDefectDto, DefectDto> {
    constructor(
        private readonly defectRepository: DefectRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreateDefectDto>): Promise<DefectDto> {
        const defect = Defect.create({...payload, createdById: actor.userId});

        await this.defectRepository.save(defect);

        this.eventDispatcher.dispatch(actor, defect);

        return new DefectDto(defect);
    }
}
