import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {ClinicDto, CreateClinicDto} from '@application/clinic/dtos';
import {AccessDeniedException, AccessDeniedReason} from '@domain/@shared/exceptions';
import {DocumentId, Email, Phone} from '@domain/@shared/value-objects';
import {GlobalRole} from '@domain/auth';
import {ClinicRepository} from '@domain/clinic/clinic.repository';
import {Clinic, ClinicAccountType} from '@domain/clinic/entities';
import {EventDispatcher} from '@domain/event';
import {UserRepository} from '@domain/user/user.repository';

export const CLINIC_CREATION_NOT_ALLOWED = 'Only clinic owners can create a clinic.';

@Injectable()
export class CreateClinicService implements ApplicationService<CreateClinicDto, ClinicDto> {
    constructor(
        private readonly clinicRepository: ClinicRepository,
        private readonly eventDispatcher: EventDispatcher,
        private readonly userRepository: UserRepository
    ) {}

    async execute({actor, payload}: Command<CreateClinicDto>): Promise<ClinicDto> {
        // Accounts created for team members (GlobalRole.NONE) must not spin up clinics of their own;
        // only self-registered owners (sign-up is gated by SIGN_UP_MODE) and super admins can.
        const user = await this.userRepository.findById(actor.userId);

        if (user === null || user.globalRole === GlobalRole.NONE) {
            throw new AccessDeniedException(CLINIC_CREATION_NOT_ALLOWED, AccessDeniedReason.NOT_ALLOWED);
        }

        const accountType =
            payload.accountType ??
            (payload.isPersonalClinic === true ? ClinicAccountType.SOLO : ClinicAccountType.CLINIC);
        const clinic = Clinic.create({
            name: payload.name,
            createdByUserId: actor.userId,
            documentId: payload.documentId ? DocumentId.create(payload.documentId) : null,
            phone: payload.phone ? Phone.create(payload.phone) : null,
            email: payload.email ? Email.create(payload.email) : null,
            accountType,
            receptionEnabled: accountType === ClinicAccountType.CLINIC,
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
            roomManagementEnabled: false,
        });

        await this.clinicRepository.save(clinic);
        this.eventDispatcher.dispatch(actor, clinic);

        return new ClinicDto(clinic);
    }
}
