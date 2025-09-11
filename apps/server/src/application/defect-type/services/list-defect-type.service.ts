import {Injectable} from '@nestjs/common';
import {DefectTypeRepository} from '../../../domain/defect-type/defect-type.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {DefectTypeDto, ListDefectTypeDto} from '../dtos';

@Injectable()
export class ListDefectTypeService implements ApplicationService<ListDefectTypeDto, PaginatedDto<DefectTypeDto>> {
    constructor(private readonly defectTypeRepository: DefectTypeRepository) {}

    async execute({payload}: Command<ListDefectTypeDto>): Promise<PaginatedDto<DefectTypeDto>> {
        const result = await this.defectTypeRepository.search(
            payload.companyId,
            {
                cursor: payload.pagination.cursor ?? undefined,
                limit: payload.pagination.limit,
                sort: payload.pagination.sort ?? {},
            },
            {
                name: payload.name,
            }
        );

        return {
            ...result,
            data: result.data.map((defectType) => new DefectTypeDto(defectType)),
        };
    }
}
