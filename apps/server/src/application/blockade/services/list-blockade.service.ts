import {Injectable} from '@nestjs/common';
import {BlockadeRepository} from '../../../domain/blockade/blockade.repository';
import {CompanyId} from '../../../domain/company/entities';
import {DefectRepository} from '../../../domain/defect/defect.repository';
import {Defect, DefectId} from '../../../domain/defect/entities';
import type {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {BlockadeDto, ListBlockadeDto} from '../dtos';

@Injectable()
export class ListBlockadeService implements ApplicationService<ListBlockadeDto, PaginatedDto<BlockadeDto>> {
    constructor(
        private readonly blockadeRepository: BlockadeRepository,
        private readonly defectRepository: DefectRepository
    ) {}

    async execute({payload}: Command<ListBlockadeDto>): Promise<PaginatedDto<BlockadeDto>> {
        const result = await this.blockadeRepository.search(
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
                note: payload.note,
            }
        );

        return {
            ...result,
            data: await Promise.all(
                result.data.map(async (blockade) => {
                    const defects = await this.getDefects(blockade.companyId, blockade.defects);

                    return new BlockadeDto({...blockade, defects});
                })
            ),
        };
    }

    private async getDefects(companyId: CompanyId, defectIds: DefectId[]): Promise<Defect[]> {
        const {data: defects} = await this.defectRepository.search(
            companyId,
            {
                limit: defectIds.length,
                sort: {},
            },
            {
                defectIds,
            }
        );

        return defects;
    }
}
