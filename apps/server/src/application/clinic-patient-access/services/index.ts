import { Injectable } from "@nestjs/common";
import { ClinicId } from "@domain/clinic/entities";
import { ClinicMemberId } from "@domain/clinic-member/entities";
import { ClinicPatientAccess } from "@domain/clinic-patient-access/entities";
import { ClinicPatientAccessRepository } from "@domain/clinic-patient-access/clinic-patient-access.repository";
import { EventDispatcher } from "@domain/event";
import { PatientId } from "@domain/patient/entities";
import { ApplicationService, Command } from "@application/@shared/application.service";
import {
  ClinicPatientAccessDto,
  GrantClinicPatientAccessDto,
} from "@application/clinic-patient-access/dtos";

@Injectable()
export class GrantClinicPatientAccessService implements ApplicationService<
  GrantClinicPatientAccessDto,
  ClinicPatientAccessDto
> {
  constructor(
    private readonly accessRepository: ClinicPatientAccessRepository,
    private readonly eventDispatcher: EventDispatcher,
  ) {}

  async execute({
    actor,
    payload,
  }: Command<GrantClinicPatientAccessDto>): Promise<ClinicPatientAccessDto> {
    const access = ClinicPatientAccess.create({
      clinicId: ClinicId.from(payload.clinicId),
      memberId: ClinicMemberId.from(payload.memberId),
      patientId: PatientId.from(payload.patientId),
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
    private readonly eventDispatcher: EventDispatcher,
  ) {}

  async execute({ actor, payload }: Command<RevokeAccessInput>): Promise<void> {
    const access = await this.accessRepository.findByMemberAndPatient(
      payload.memberId,
      payload.patientId,
    );

    if (access === null) return;

    access.revoke();
    await this.accessRepository.save(access);
    this.eventDispatcher.dispatch(actor, access);
  }
}
