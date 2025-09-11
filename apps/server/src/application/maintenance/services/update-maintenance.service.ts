import {Injectable} from '@nestjs/common';
import {PreconditionException, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {CompanyId} from '../../../domain/company/entities';
import {DefectRepository} from '../../../domain/defect/defect.repository';
import {Defect, DefectId} from '../../../domain/defect/entities';
import {EventDispatcher} from '../../../domain/event';
import {MaintenanceRepository} from '../../../domain/maintenance/maintenance.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {MaintenanceDto, UpdateMaintenanceDto} from '../dtos';

@Injectable()
export class UpdateMaintenanceService implements ApplicationService<UpdateMaintenanceDto, MaintenanceDto> {
    constructor(
        private readonly maintenanceRepository: MaintenanceRepository,
        private readonly defectRepository: DefectRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<UpdateMaintenanceDto>): Promise<MaintenanceDto> {
        const maintenance = await this.maintenanceRepository.findById(payload.id);

        if (!maintenance) {
            throw new ResourceNotFoundException('Maintenance not found', payload.id.toString());
        }

        maintenance.change({...payload});

        await this.maintenanceRepository.save(maintenance);

        const defects = await this.getDefects(maintenance.companyId, payload.defects ?? maintenance.defects);

        this.eventDispatcher.dispatch(actor, maintenance);

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
