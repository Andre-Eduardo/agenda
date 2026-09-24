import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {CreatePatientDto, PatientDto} from '@application/patient/dtos';
import {AccessDeniedException, AccessDeniedReason} from '@domain/@shared/exceptions';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMemberRole} from '@domain/clinic-member/entities';
import {ClinicPatientAccessRepository} from '@domain/clinic-patient-access/clinic-patient-access.repository';
import {ClinicPatientAccess, PatientAccessLevel} from '@domain/clinic-patient-access/entities';
import {EventDispatcher} from '@domain/event';
import {Patient, PatientId} from '@domain/patient/entities';
import {PatientRepository} from '@domain/patient/patient.repository';
import {PersonType} from '@domain/person/entities';

@Injectable()
export class CreatePatientService implements ApplicationService<CreatePatientDto, PatientDto> {
    constructor(
        private readonly patientRepository: PatientRepository,
        private readonly memberRepository: ClinicMemberRepository,
        private readonly accessRepository: ClinicPatientAccessRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreatePatientDto>): Promise<PatientDto> {
        // Tenant boundary: prefer the clinicId injected from the cookie via the
        // request-context middleware; only fall back to the actor's clinicId if
        // the request didn't carry one (this happens with @BypassClinicMember
        // routes, which shouldn't reach this service in practice).
        const clinicId = payload.clinicId ?? actor.clinicId;

        assertEntityBelongsToClinic(clinicId, actor.clinicId);
        const member = await this.memberRepository.findById(actor.clinicMemberId);

        if (
            member === null ||
            !member.isActive ||
            !member.clinicId.equals(actor.clinicId) ||
            !member.userId.equals(actor.userId)
        ) {
            throw new AccessDeniedException('Clinic member is not active.', AccessDeniedReason.NOT_ALLOWED);
        }

        const patient = Patient.create({
            ...payload,
            clinicId,
            phone: payload.phone ?? null,
            gender: payload.gender ?? null,
            personType: payload.personType ?? PersonType.NATURAL,
            birthDate: payload.birthDate ?? null,
            email: payload.email ?? null,
            emergencyContactName: payload.emergencyContactName ?? null,
            emergencyContactPhone: payload.emergencyContactPhone ?? null,
            address: payload.address
                ? {
                      street: payload.address.street ?? null,
                      number: payload.address.number ?? null,
                      complement: payload.address.complement ?? null,
                      neighborhood: payload.address.neighborhood ?? null,
                      city: payload.address.city ?? null,
                      state: payload.address.state ?? null,
                      zipCode: payload.address.zipCode ?? null,
                      country: payload.address.country ?? null,
                  }
                : null,
            insurancePlanId: payload.insurancePlanId ?? null,
            insuranceCardNumber: payload.insuranceCardNumber ?? null,
            insuranceValidUntil: payload.insuranceValidUntil ?? null,
        });

        // PatientPrismaRepository persists Person + Patient + PatientAddress atomically.
        await this.patientRepository.save(patient);

        if (!member.hasRole(ClinicMemberRole.OWNER) && !member.hasRole(ClinicMemberRole.ADMIN)) {
            const access = ClinicPatientAccess.create({
                clinicId: actor.clinicId,
                memberId: actor.clinicMemberId,
                patientId: PatientId.from(patient.id.toString()),
                accessLevel: member.hasRole(ClinicMemberRole.PROFESSIONAL)
                    ? PatientAccessLevel.FULL
                    : PatientAccessLevel.REGISTER_ONLY,
                reason: 'Initial access for the registering member',
            });

            await this.accessRepository.save(access);
            this.eventDispatcher.dispatch(actor, access);
        }

        this.eventDispatcher.dispatch(actor, patient);

        return new PatientDto(patient);
    }
}
