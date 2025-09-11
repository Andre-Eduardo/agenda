import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {CompanyId} from '../../../domain/company/entities';
import {DefectRepository} from '../../../domain/defect/defect.repository';
import {Defect, DefectId} from '../../../domain/defect/entities';
import {EventDispatcher} from '../../../domain/event';
import {MaintenanceRepository} from '../../../domain/maintenance/maintenance.repository';
import {RoomStateEvent} from '../../../domain/room/models/room-state';
import {RoomStateService} from '../../../domain/room/services';
import type {ApplicationService, Command} from '../../@shared/application.service';
import type {FinishMaintenanceDto} from '../dtos';
import {MaintenanceDto} from '../dtos';

@Injectable()
export class FinishMaintenanceService implements ApplicationService<FinishMaintenanceDto, MaintenanceDto> {
    constructor(
        private readonly maintenanceRepository: MaintenanceRepository,
        private readonly defectRepository: DefectRepository,
        private readonly roomStateService: RoomStateService,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<FinishMaintenanceDto>): Promise<MaintenanceDto> {
        const maintenance = await this.maintenanceRepository.findByRoom(payload.roomId);

        if (!maintenance) {
            throw new ResourceNotFoundException('Maintenance not found', payload.roomId.toString());
        }

        const room = await this.roomStateService.changeRoomState(maintenance.roomId, {
            type: RoomStateEvent.COMPLETE_MAINTENANCE,
        });

        maintenance.finish(actor.userId);

        await this.maintenanceRepository.save(maintenance);

        const defects = await this.getDefects(maintenance.companyId, maintenance.defects);

        this.eventDispatcher.dispatch(actor, maintenance);
        this.eventDispatcher.dispatch(actor, room);

        return new MaintenanceDto({...maintenance, defects});
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
