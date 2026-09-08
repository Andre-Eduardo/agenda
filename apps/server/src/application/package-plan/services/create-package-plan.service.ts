import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {CreatePackagePlanDto, PackagePlanDto} from '@application/package-plan/dtos';
import {EventDispatcher} from '@domain/event';
import {PackagePlan} from '@domain/package-plan/entities';
import {PackagePlanRepository} from '@domain/package-plan/package-plan.repository';

@Injectable()
export class CreatePackagePlanService implements ApplicationService<CreatePackagePlanDto, PackagePlanDto> {
    constructor(
        private readonly packagePlanRepository: PackagePlanRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreatePackagePlanDto>): Promise<PackagePlanDto> {
        const plan = PackagePlan.create({
            clinicId: actor.clinicId,
            name: payload.name,
            description: payload.description ?? null,
            totalCredits: payload.totalCredits,
            priceBrl: payload.priceBrl,
            validityDays: payload.validityDays ?? null,
            appointmentType: payload.appointmentType ?? null,
        });

        await this.packagePlanRepository.save(plan);

        this.eventDispatcher.dispatch(actor, plan);

        return new PackagePlanDto(plan);
    }
}
