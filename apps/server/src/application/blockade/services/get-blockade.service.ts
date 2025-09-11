import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {BlockadeRepository} from '../../../domain/blockade/blockade.repository';
import {CompanyId} from '../../../domain/company/entities';
import {DefectRepository} from '../../../domain/defect/defect.repository';
import {Defect, DefectId} from '../../../domain/defect/entities';
import type {ApplicationService, Command} from '../../@shared/application.service';
import type {GetBlockadeDto} from '../dtos';
import {BlockadeDto} from '../dtos';

@Injectable()
export class GetBlockadeService implements ApplicationService<GetBlockadeDto, BlockadeDto> {
    constructor(
        private readonly blockadeRepository: BlockadeRepository,
        private readonly defectRepository: DefectRepository
    ) {}

    async execute({payload}: Command<GetBlockadeDto>): Promise<BlockadeDto> {
        const blockade = await this.blockadeRepository.findById(payload.id);

        if (!blockade) {
            throw new ResourceNotFoundException('Blockade not found', payload.id.toString());
        }

        const existingDefects = blockade.defects.map((defects) => defects);

        const defects = await this.getDefects(blockade.companyId, existingDefects);

        return new BlockadeDto({...blockade, defects});
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
