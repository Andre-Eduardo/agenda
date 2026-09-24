import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {ClinicPatientAccessDto, GrantClinicPatientAccessDto} from '@application/clinic-patient-access/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicPatientAccessRepository} from '@domain/clinic-patient-access/clinic-patient-access.repository';
import {ClinicPatientAccess} from '@domain/clinic-patient-access/entities';
import {ClinicId} from '@domain/clinic/entities';
import {EventDispatcher} from '@domain/event';
import {PatientId} from '@domain/patient/entities';
import {PatientRepository} from '@domain/patient/patient.repository';

@Injectable()
export class GrantClinicPatientAccessService implements ApplicationService<
    GrantClinicPatientAccessDto,
    ClinicPatientAccessDto
> {
    constructor(
        private readonly accessRepository: ClinicPatientAccessRepository,
        private readonly memberRepository: ClinicMemberRepository,
        private readonly patientRepository: PatientRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<GrantClinicPatientAccessDto>): Promise<ClinicPatientAccessDto> {
        const clinicId = ClinicId.from(payload.clinicId);
        const memberId = ClinicMemberId.from(payload.memberId);
        const patientId = PatientId.from(payload.patientId);

        assertEntityBelongsToClinic(clinicId, actor.clinicId);
        const [member, patient] = await Promise.all([
            this.memberRepository.findById(memberId),
            this.patientRepository.findById(patientId),
        ]);

        if (member === null || !member.isActive || patient === null) {
            throw new ResourceNotFoundException('Member or patient not found.');
        }

        assertEntityBelongsToClinic(member.clinicId, actor.clinicId);
        assertEntityBelongsToClinic(patient.clinicId, actor.clinicId);

        const access = ClinicPatientAccess.create({
            clinicId,
            memberId,
            patientId,
            accessLevel: payload.accessLevel,
            reason: payload.reason ?? null,
        });

        await this.accessRepository.save(access);
        this.eventDispatcher.dispatch(actor, access);

        return new ClinicPatientAccessDto(access);
    }
}

export type RevokeAccessInput = {
    memberId: ClinicMemberId;
    patientId: PatientId;
};

@Injectable()
export class RevokeClinicPatientAccessService implements ApplicationService<RevokeAccessInput> {
    constructor(
        private readonly accessRepository: ClinicPatientAccessRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<RevokeAccessInput>): Promise<void> {
        const access = await this.accessRepository.findByMemberAndPatient(payload.memberId, payload.patientId);

        if (access === null) return;

        assertEntityBelongsToClinic(access.clinicId, actor.clinicId);

        access.revoke();
        await this.accessRepository.save(access);
        this.eventDispatcher.dispatch(actor, access);
    }
}
