import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {PackagePlanDto, UpdatePackagePlanDto} from '@application/package-plan/dtos';
import {PreconditionException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {EventDispatcher} from '@domain/event';
import {PackagePlanRepository} from '@domain/package-plan/package-plan.repository';

@Injectable()
export class UpdatePackagePlanService implements ApplicationService<UpdatePackagePlanDto, PackagePlanDto> {
    constructor(
        private readonly packagePlanRepository: PackagePlanRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload: {id, ...props}}: Command<UpdatePackagePlanDto>): Promise<PackagePlanDto> {
        const plan = await this.packagePlanRepository.findById(id);

        if (plan === null) {
            throw new ResourceNotFoundException('package_plan.not_found', id.toString());
        }

        if (!plan.clinicId.equals(actor.clinicId)) {
            throw new PreconditionException('Package plan does not belong to the current clinic.');
        }

        plan.updateDetails(props);

        await this.packagePlanRepository.save(plan);

        this.eventDispatcher.dispatch(actor, plan);

        return new PackagePlanDto(plan);
    }
}
