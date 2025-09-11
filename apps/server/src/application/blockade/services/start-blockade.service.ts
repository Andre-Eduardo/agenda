import {Injectable} from '@nestjs/common';
import {PreconditionException, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {BlockadeRepository} from '../../../domain/blockade/blockade.repository';
import {Blockade} from '../../../domain/blockade/entities';
import {CompanyId} from '../../../domain/company/entities';
import {DefectRepository} from '../../../domain/defect/defect.repository';
import {Defect, DefectId} from '../../../domain/defect/entities';
import {EventDispatcher} from '../../../domain/event';
import {RoomStateEvent} from '../../../domain/room/models/room-state';
import {RoomStateService} from '../../../domain/room/services';
import {ApplicationService, Command} from '../../@shared/application.service';
import {BlockadeDto, StartBlockadeDto} from '../dtos';

@Injectable()
export class StartBlockadeService implements ApplicationService<StartBlockadeDto, BlockadeDto> {
    constructor(
        private readonly blockadeRepository: BlockadeRepository,
        private readonly defectRepository: DefectRepository,
        private readonly roomStateService: RoomStateService,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<StartBlockadeDto>): Promise<BlockadeDto> {
        const existingBlockade = await this.blockadeRepository.findByRoom(payload.roomId);

        if (existingBlockade) {
            throw new PreconditionException('There is already blockade in this room.');
        }

        const blockade = Blockade.start({...payload, startedById: actor.userId});

        const room = await this.roomStateService.changeRoomState(blockade.roomId, {
            type: RoomStateEvent.BLOCK,
        });

        await this.blockadeRepository.save(blockade);

        const defects = await this.getDefects(payload.companyId, payload.defects);

        this.eventDispatcher.dispatch(actor, blockade);
        this.eventDispatcher.dispatch(actor, room);

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
