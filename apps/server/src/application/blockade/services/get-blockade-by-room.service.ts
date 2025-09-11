import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {BlockadeRepository} from '../../../domain/blockade/blockade.repository';
import {CompanyId} from '../../../domain/company/entities';
import {DefectRepository} from '../../../domain/defect/defect.repository';
import {Defect, DefectId} from '../../../domain/defect/entities';
import type {ApplicationService, Command} from '../../@shared/application.service';
import {BlockadeDto, GetBlockadeByRoomDto} from '../dtos';

@Injectable()
export class GetBlockadeByRoomService implements ApplicationService<GetBlockadeByRoomDto, BlockadeDto> {
    constructor(
        private readonly blockadeRepository: BlockadeRepository,
        private readonly defectRepository: DefectRepository
    ) {}

    async execute({payload}: Command<GetBlockadeByRoomDto>): Promise<BlockadeDto> {
        const blockade = await this.blockadeRepository.findByRoom(payload.roomId);

        if (!blockade) {
            throw new ResourceNotFoundException('No blockade found for the room.', payload.roomId.toString());
        }

        const defects = await this.getDefects(blockade.companyId, blockade.defects);

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
