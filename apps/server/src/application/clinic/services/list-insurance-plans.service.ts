import {Injectable} from '@nestjs/common';
import {ClinicId} from '../../../domain/clinic/entities';
import {InsurancePlanRepository} from '../../../domain/insurance-plan/insurance-plan.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {InsurancePlanDto} from '../dtos';

export type ListInsurancePlansInput = {clinicId: ClinicId};

@Injectable()
export class ListInsurancePlansService implements ApplicationService<ListInsurancePlansInput, InsurancePlanDto[]> {
    constructor(private readonly insurancePlanRepository: InsurancePlanRepository) {}

    async execute({payload}: Command<ListInsurancePlansInput>): Promise<InsurancePlanDto[]> {
        const plans = await this.insurancePlanRepository.findByClinicId(payload.clinicId);
        return plans.map((plan) => new InsurancePlanDto(plan));
    }
}
