import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {PackagePlanDto} from '@application/package-plan/dtos';
import {PackagePlanRepository} from '@domain/package-plan/package-plan.repository';

@Injectable()
export class ListPackagePlansService implements ApplicationService<undefined, PackagePlanDto[]> {
    constructor(private readonly packagePlanRepository: PackagePlanRepository) {}

    async execute({actor}: Command): Promise<PackagePlanDto[]> {
        const plans = await this.packagePlanRepository.findByClinicId(actor.clinicId);

        return plans.map((p) => new PackagePlanDto(p));
    }
}
