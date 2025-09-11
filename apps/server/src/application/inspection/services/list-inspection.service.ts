import {Injectable} from '@nestjs/common';
import {InspectionRepository} from '../../../domain/inspection/inspection.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {ListInspectionDto, InspectionDto} from '../dtos';

@Injectable()
export class ListInspectionService implements ApplicationService<ListInspectionDto, PaginatedDto<InspectionDto>> {
    constructor(private readonly inspectionRepository: InspectionRepository) {}

    async execute({payload}: Command<ListInspectionDto>): Promise<PaginatedDto<InspectionDto>> {
        const result = await this.inspectionRepository.search(
            payload.companyId,
            {
                cursor: payload.pagination.cursor ?? undefined,
                limit: payload.pagination.limit,
                sort: payload.pagination.sort ?? {},
            },
            {
                roomId: payload.roomId,
                startedById: payload.startedById,
                finishedById: payload.finishedById,
                endReason: payload.endReason,
            }
        );

        return {
            ...result,
            data: result.data.map((inspection) => new InspectionDto(inspection)),
        };
    }
}
