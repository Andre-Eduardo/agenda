import {Injectable} from '@nestjs/common';
import {
    DuplicateNameException,
    PreconditionException,
    ResourceNotFoundException,
} from '../../../domain/@shared/exceptions';
import {DefectTypeRepository} from '../../../domain/defect-type/defect-type.repository';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {DefectTypeDto, UpdateDefectTypeDto} from '../dtos';

@Injectable()
export class UpdateDefectTypeService implements ApplicationService<UpdateDefectTypeDto, DefectTypeDto> {
    constructor(
        private readonly defectTypeRepository: DefectTypeRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<UpdateDefectTypeDto>): Promise<DefectTypeDto> {
        const defectType = await this.defectTypeRepository.findById(payload.id);

        if (!defectType) {
            throw new ResourceNotFoundException('Defect type not found', payload.id.toString());
        }

        defectType.change(payload);

        try {
            await this.defectTypeRepository.save(defectType);
        } catch (e) {
            if (e instanceof DuplicateNameException) {
                throw new PreconditionException('Cannot update a defect type with a name already in use.');
            }

            throw e;
        }

        this.eventDispatcher.dispatch(actor, defectType);

        return new DefectTypeDto(defectType);
    }
}
