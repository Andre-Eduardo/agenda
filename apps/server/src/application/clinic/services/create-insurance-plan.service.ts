import { Injectable } from "@nestjs/common";
import { InsurancePlan } from "@domain/insurance-plan/entities";
import { InsurancePlanRepository } from "@domain/insurance-plan/insurance-plan.repository";
import { EventDispatcher } from "@domain/event";
import { ApplicationService, Command } from "@application/@shared/application.service";
import { CreateInsurancePlanDto, InsurancePlanDto } from "@application/clinic/dtos";

@Injectable()
export class CreateInsurancePlanService implements ApplicationService<
  CreateInsurancePlanDto,
  InsurancePlanDto
> {
  constructor(
    private readonly insurancePlanRepository: InsurancePlanRepository,
    private readonly eventDispatcher: EventDispatcher,
  ) {}

  async execute({ actor, payload }: Command<CreateInsurancePlanDto>): Promise<InsurancePlanDto> {
    const clinicId = payload.clinicId ?? actor.clinicId;

    const plan = InsurancePlan.create({
      clinicId,
      name: payload.name,
      code: payload.code ?? null,
      isActive: true,
    });

    await this.insurancePlanRepository.save(plan);
    this.eventDispatcher.dispatch(actor, plan);

    return new InsurancePlanDto(plan);
  }
}
