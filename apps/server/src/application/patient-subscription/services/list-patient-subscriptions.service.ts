import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {ListPatientSubscriptionsDto, PatientSubscriptionDto} from '@application/patient-subscription/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {PatientSubscriptionRepository} from '@domain/patient-subscription/patient-subscription.repository';
import {PatientRepository} from '@domain/patient/patient.repository';

@Injectable()
export class ListPatientSubscriptionsService implements ApplicationService<
    ListPatientSubscriptionsDto,
    PatientSubscriptionDto[]
> {
    constructor(
        private readonly subscriptionRepository: PatientSubscriptionRepository,
        private readonly patientRepository: PatientRepository
    ) {}

    async execute({actor, payload}: Command<ListPatientSubscriptionsDto>): Promise<PatientSubscriptionDto[]> {
        const patient = await this.patientRepository.findById(payload.patientId, actor.clinicId);

        if (patient === null) {
            throw new ResourceNotFoundException('patient.not_found', payload.patientId.toString());
        }

        const subscriptions = await this.subscriptionRepository.findByPatientId(payload.patientId);

        return subscriptions.map((s) => new PatientSubscriptionDto(s));
    }
}
