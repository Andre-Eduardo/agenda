import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {DefectTypeRepository} from '../../../domain/defect-type/defect-type.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {DefectTypeDto, GetDefectTypeDto} from '../dtos';

@Injectable()
export class GetDefectTypeService implements ApplicationService<GetDefectTypeDto, DefectTypeDto> {
    constructor(private readonly defectTypeRepository: DefectTypeRepository) {}

    async execute({payload}: Command<GetDefectTypeDto>): Promise<DefectTypeDto> {
        const defectType = await this.defectTypeRepository.findById(payload.id);

        if (!defectType) {
            throw new ResourceNotFoundException('Defect type not found', payload.id.toString());
        }

        return new DefectTypeDto(defectType);
    }
}
