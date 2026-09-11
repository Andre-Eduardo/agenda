import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {CancelPatientSubscriptionDto, PatientSubscriptionDto} from '@application/patient-subscription/dtos';
import {PreconditionException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {EventDispatcher} from '@domain/event';
import {PatientSubscriptionRepository} from '@domain/patient-subscription/patient-subscription.repository';

@Injectable()
export class CancelPatientSubscriptionService implements ApplicationService<
    CancelPatientSubscriptionDto,
    PatientSubscriptionDto
> {
    constructor(
        private readonly subscriptionRepository: PatientSubscriptionRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({
        actor,
        payload: {id, reason},
    }: Command<CancelPatientSubscriptionDto>): Promise<PatientSubscriptionDto> {
        const subscription = await this.subscriptionRepository.findById(id);

        if (subscription === null) {
            throw new ResourceNotFoundException('patient_subscription.not_found', id.toString());
        }

        if (!subscription.clinicId.equals(actor.clinicId)) {
            throw new PreconditionException('Subscription does not belong to the current clinic.');
        }

        subscription.cancel(reason);

        await this.subscriptionRepository.save(subscription);

        this.eventDispatcher.dispatch(actor, subscription);

        return new PatientSubscriptionDto(subscription);
    }
}
