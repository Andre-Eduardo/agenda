import {Injectable} from '@nestjs/common';
import {DuplicateNameException, PreconditionException} from '../../../domain/@shared/exceptions';
import {DefectTypeRepository} from '../../../domain/defect-type/defect-type.repository';
import {DefectType} from '../../../domain/defect-type/entities';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CreateDefectTypeDto, DefectTypeDto} from '../dtos';

@Injectable()
export class CreateDefectTypeService implements ApplicationService<CreateDefectTypeDto, DefectTypeDto> {
    constructor(
        private readonly defectTypeRepository: DefectTypeRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreateDefectTypeDto>): Promise<DefectTypeDto> {
        const defectType = DefectType.create(payload);

        try {
            await this.defectTypeRepository.save(defectType);
        } catch (e) {
            if (e instanceof DuplicateNameException) {
                throw new PreconditionException('Cannot create a defect type with a name already in use.');
            }

            throw e;
        }

        this.eventDispatcher.dispatch(actor, defectType);

        return new DefectTypeDto(defectType);
    }
}
