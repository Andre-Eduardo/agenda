import {Injectable} from '@nestjs/common';
import {EventDispatcher} from '../../../domain/event';
import {Clinic} from '../../../domain/clinic/entities';
import {ClinicRepository} from '../../../domain/clinic/clinic.repository';
import {DocumentId, Email, Phone} from '../../../domain/@shared/value-objects';
import {ApplicationService, Command} from '../../@shared/application.service';
import {ClinicDto, CreateClinicDto} from '../dtos';

@Injectable()
export class CreateClinicService implements ApplicationService<CreateClinicDto, ClinicDto> {
    constructor(
        private readonly clinicRepository: ClinicRepository,
        private readonly eventDispatcher: EventDispatcher,
    ) {}

    async execute({actor, payload}: Command<CreateClinicDto>): Promise<ClinicDto> {
        const clinic = Clinic.create({
            name: payload.name,
            documentId: payload.documentId ? DocumentId.create(payload.documentId) : null,
            phone: payload.phone ? Phone.create(payload.phone) : null,
            email: payload.email ? Email.create(payload.email) : null,
            isPersonalClinic: payload.isPersonalClinic ?? false,
            street: payload.street ?? null,
            number: payload.number ?? null,
            complement: payload.complement ?? null,
            neighborhood: payload.neighborhood ?? null,
            city: payload.city ?? null,
            state: payload.state ?? null,
            zipCode: payload.zipCode ?? null,
            country: payload.country ?? null,
            logoUrl: payload.logoUrl ?? null,
            clinicSpecialties: payload.clinicSpecialties ?? [],
        });

        await this.clinicRepository.save(clinic);
        this.eventDispatcher.dispatch(actor, clinic);

        return new ClinicDto(clinic);
    }
}
