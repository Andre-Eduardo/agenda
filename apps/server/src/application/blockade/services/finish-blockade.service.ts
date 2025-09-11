import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {BlockadeRepository} from '../../../domain/blockade/blockade.repository';
import {CompanyId} from '../../../domain/company/entities';
import {DefectRepository} from '../../../domain/defect/defect.repository';
import {Defect, DefectId} from '../../../domain/defect/entities';
import {EventDispatcher} from '../../../domain/event';
import {RoomStateEvent} from '../../../domain/room/models/room-state';
import {RoomStateService} from '../../../domain/room/services';
import type {ApplicationService, Command} from '../../@shared/application.service';
import type {FinishBlockadeDto} from '../dtos';
import {BlockadeDto} from '../dtos';

@Injectable()
export class FinishBlockadeService implements ApplicationService<FinishBlockadeDto, BlockadeDto> {
    constructor(
        private readonly blockadeRepository: BlockadeRepository,
        private readonly defectRepository: DefectRepository,
        private readonly roomStateService: RoomStateService,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<FinishBlockadeDto>): Promise<BlockadeDto> {
        const blockade = await this.blockadeRepository.findByRoom(payload.roomId);

        if (!blockade) {
            throw new ResourceNotFoundException('No Blockade was found in the room', payload.roomId.toString());
        }

        const existingDefects = blockade.defects.map((defects) => defects);

        const room = await this.roomStateService.changeRoomState(blockade.roomId, {
            type: RoomStateEvent.UNBLOCK,
        });

        blockade.finish(actor.userId);

        await this.blockadeRepository.save(blockade);

        const defects = await this.getDefects(blockade.companyId, existingDefects);

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

        return defects;
    }
}
