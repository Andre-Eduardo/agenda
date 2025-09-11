import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {CompanyId} from '../../../domain/company/entities';
import {DefectRepository} from '../../../domain/defect/defect.repository';
import {Defect, DefectId} from '../../../domain/defect/entities';
import {MaintenanceRepository} from '../../../domain/maintenance/maintenance.repository';
import type {ApplicationService, Command} from '../../@shared/application.service';
import type {GetMaintenanceDto} from '../dtos';
import {MaintenanceDto} from '../dtos/maintenance.dto';

@Injectable()
export class GetMaintenanceService implements ApplicationService<GetMaintenanceDto, MaintenanceDto> {
    constructor(
        private readonly maintenanceRepository: MaintenanceRepository,
        private readonly defectRepository: DefectRepository
    ) {}

    async execute({payload}: Command<GetMaintenanceDto>): Promise<MaintenanceDto> {
        const maintenance = await this.maintenanceRepository.findById(payload.id);

        if (!maintenance) {
            throw new ResourceNotFoundException('Maintenance not found', payload.id.toString());
        }

        const defects = await this.getDefects(maintenance.companyId, maintenance.defects);

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
