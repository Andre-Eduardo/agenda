import {Injectable} from '@nestjs/common';
import {PreconditionException, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {CompanyId} from '../../../domain/company/entities';
import {DefectRepository} from '../../../domain/defect/defect.repository';
import {Defect, DefectId} from '../../../domain/defect/entities';
import {EventDispatcher} from '../../../domain/event';
import {Maintenance} from '../../../domain/maintenance/entities';
import {MaintenanceRepository} from '../../../domain/maintenance/maintenance.repository';
import {RoomStateEvent} from '../../../domain/room/models/room-state';
import {RoomStateService} from '../../../domain/room/services';
import {ApplicationService, Command} from '../../@shared/application.service';
import {MaintenanceDto, StartMaintenanceDto} from '../dtos';

@Injectable()
export class StartMaintenanceService implements ApplicationService<StartMaintenanceDto, MaintenanceDto> {
    constructor(
        private readonly maintenanceRepository: MaintenanceRepository,
        private readonly defectRepository: DefectRepository,
        private readonly roomStateService: RoomStateService,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<StartMaintenanceDto>): Promise<MaintenanceDto> {
        const existingMaintenance = await this.maintenanceRepository.findByRoom(payload.roomId);

        if (existingMaintenance) {
            throw new PreconditionException('There is already maintenance in this room.');
        }

        const defects = await this.getDefects(payload.companyId, payload.defects);

        const maintenance = Maintenance.create({...payload, startedById: actor.userId});

        const room = await this.roomStateService.changeRoomState(maintenance.roomId, {
            type: RoomStateEvent.PERFORM_MAINTENANCE,
        });

        await this.maintenanceRepository.save(maintenance);

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

        if (defects.length === 0) {
            throw new ResourceNotFoundException('No defects found.', defectIds.join(', '));
        }

        if (defects.some((defect) => defect.finishedAt !== null)) {
            throw new PreconditionException('A maintenance cannot be performed with finished defects.');
        }

        return defects;
    }
}
