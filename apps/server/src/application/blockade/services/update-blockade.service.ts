import {Injectable} from '@nestjs/common';
import {PreconditionException, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {BlockadeRepository} from '../../../domain/blockade/blockade.repository';
import {CompanyId} from '../../../domain/company/entities';
import {DefectRepository} from '../../../domain/defect/defect.repository';
import {Defect, DefectId} from '../../../domain/defect/entities';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {BlockadeDto, UpdateBlockadeDto} from '../dtos';

@Injectable()
export class UpdateBlockadeService implements ApplicationService<UpdateBlockadeDto, BlockadeDto> {
    constructor(
        private readonly blockadeRepository: BlockadeRepository,
        private readonly defectRepository: DefectRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<UpdateBlockadeDto>): Promise<BlockadeDto> {
        const blockade = await this.blockadeRepository.findById(payload.id);

        if (!blockade) {
            throw new ResourceNotFoundException('Blockade not found', payload.id.toString());
        }

        const existingDefects = blockade.defects.map((defects) => defects);

        blockade.change({...payload});

        await this.blockadeRepository.save(blockade);

        const defects = await this.getDefects(blockade.companyId, payload.defects ?? existingDefects);

        this.eventDispatcher.dispatch(actor, blockade);

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

        if (!defects.length) {
            throw new ResourceNotFoundException('No defects found.');
        }

        defects.forEach((defect) => {
            if (defect.finishedAt !== null) {
                throw new PreconditionException('A blockade cannot be performed with finished defects.');
            }
        });

        return defects;
    }
}
