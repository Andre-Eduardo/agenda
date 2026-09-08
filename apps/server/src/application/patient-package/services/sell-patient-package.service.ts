import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {PatientPackageDto, SellPatientPackageDto} from '@application/patient-package/dtos';
import {PreconditionException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {toEnum} from '@domain/@shared/utils';
import {PaymentMethod} from '@domain/appointment-payment/entities';
import {EventDispatcher} from '@domain/event';
import {PackagePlanRepository} from '@domain/package-plan/package-plan.repository';
import {PatientPackage} from '@domain/patient-package/entities';
import {PatientPackageRepository} from '@domain/patient-package/patient-package.repository';
import {PatientRepository} from '@domain/patient/patient.repository';

@Injectable()
export class SellPatientPackageService implements ApplicationService<SellPatientPackageDto, PatientPackageDto> {
    constructor(
        private readonly patientPackageRepository: PatientPackageRepository,
        private readonly packagePlanRepository: PackagePlanRepository,
        private readonly patientRepository: PatientRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<SellPatientPackageDto>): Promise<PatientPackageDto> {
        const patient = await this.patientRepository.findById(payload.patientId, actor.clinicId);

        if (patient === null) {
            throw new ResourceNotFoundException('patient.not_found', payload.patientId.toString());
        }

        const plan = await this.packagePlanRepository.findById(payload.packagePlanId);

        if (plan === null || !plan.clinicId.equals(actor.clinicId)) {
            throw new ResourceNotFoundException('package_plan.not_found', payload.packagePlanId.toString());
        }

        if (!plan.isActive) {
            throw new PreconditionException('package_plan.inactive');
        }

        const purchasedAt = new Date();
        const expiresAt =
            plan.validityDays !== null ? new Date(purchasedAt.getTime() + plan.validityDays * 86_400_000) : null;

        const patientPackage = PatientPackage.create({
            clinicId: actor.clinicId,
            patientId: payload.patientId,
            packagePlanId: plan.id,
            planNameSnapshot: plan.name,
            totalCredits: plan.totalCredits,
            priceBrl: plan.priceBrl,
            purchasedAt,
            expiresAt,
            paymentMethod: toEnum(PaymentMethod, payload.paymentMethod),
            paidAt: payload.paidAt ?? purchasedAt,
            soldByMemberId: actor.clinicMemberId,
        });

        await this.patientPackageRepository.save(patientPackage);

        this.eventDispatcher.dispatch(actor, patientPackage);

        return new PatientPackageDto(patientPackage);
    }
}
