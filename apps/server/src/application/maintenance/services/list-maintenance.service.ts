import {Injectable} from '@nestjs/common';
import {CompanyId} from '../../../domain/company/entities';
import {DefectRepository} from '../../../domain/defect/defect.repository';
import {Defect, DefectId} from '../../../domain/defect/entities';
import {MaintenanceRepository} from '../../../domain/maintenance/maintenance.repository';
import type {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {ListMaintenanceDto} from '../dtos';
import {MaintenanceDto} from '../dtos/maintenance.dto';

@Injectable()
export class ListMaintenanceService implements ApplicationService<ListMaintenanceDto, PaginatedDto<MaintenanceDto>> {
    constructor(
        private readonly maintenanceRepository: MaintenanceRepository,
        private readonly defectRepository: DefectRepository
    ) {}

    async execute({payload}: Command<ListMaintenanceDto>): Promise<PaginatedDto<MaintenanceDto>> {
        const result = await this.maintenanceRepository.search(
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
                result.data.map(async (maintenance) => {
                    const defects = await this.getDefects(maintenance.companyId, maintenance.defects);

                    return new MaintenanceDto({...maintenance, defects});
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
