import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {DefectRepository} from '../../../domain/defect/defect.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {GetDefectDto, DefectDto} from '../dtos';

@Injectable()
export class GetDefectService implements ApplicationService<GetDefectDto, DefectDto> {
    constructor(private readonly defectRepository: DefectRepository) {}

    async execute({payload}: Command<GetDefectDto>): Promise<DefectDto> {
        const defect = await this.defectRepository.findById(payload.id);

        if (!defect) {
            throw new ResourceNotFoundException('Defect not found', payload.id.toString());
        }

        return new DefectDto(defect);
    }
}
