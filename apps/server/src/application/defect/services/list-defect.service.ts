import {Injectable} from '@nestjs/common';
import {DefectRepository} from '../../../domain/defect/defect.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {DefectDto, ListDefectDto} from '../dtos';

@Injectable()
export class ListDefectService implements ApplicationService<ListDefectDto, PaginatedDto<DefectDto>> {
    constructor(private readonly defectRepository: DefectRepository) {}

    async execute({payload}: Command<ListDefectDto>): Promise<PaginatedDto<DefectDto>> {
        const result = await this.defectRepository.search(
            payload.companyId,
            {
                cursor: payload.pagination.cursor ?? undefined,
                limit: payload.pagination.limit,
                sort: payload.pagination.sort ?? {},
            },
            {
                note: payload.note,
                roomId: payload.roomId,
                defectTypeId: payload.defectTypeId,
                createdById: payload.createdById,
                createdAt: payload.createdAt,
                finishedAt: payload.finishedAt,
                finishedById: payload.finishedById,
            }
        );

        return {
            ...result,
            data: result.data.map((defect) => new DefectDto(defect)),
        };
    }
}
