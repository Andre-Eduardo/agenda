import { Injectable } from "@nestjs/common";
import {
  AccessDeniedException,
  AccessDeniedReason,
  ResourceNotFoundException,
} from "@domain/@shared/exceptions";
import { ClinicMemberRepository } from "@domain/clinic-member/clinic-member.repository";
import { ClinicMemberRole } from "@domain/clinic-member/entities/clinic-member-role";
import { EventDispatcher } from "@domain/event";
import { RecordRepository } from "@domain/record/record.repository";
import { ApplicationService, Command } from "@application/@shared/application.service";
import { RecordDto, SignRecordDto } from "@application/record/dtos";

const ALLOWED_ROLES: ClinicMemberRole[] = [
  ClinicMemberRole.PROFESSIONAL,
  ClinicMemberRole.ADMIN,
  ClinicMemberRole.OWNER,
];

@Injectable()
export class SignRecordService implements ApplicationService<SignRecordDto, RecordDto> {
  constructor(
    private readonly recordRepository: RecordRepository,
    private readonly clinicMemberRepository: ClinicMemberRepository,
    private readonly eventDispatcher: EventDispatcher,
  ) {}

  async execute({ actor, payload }: Command<SignRecordDto>): Promise<RecordDto> {
    const member = await this.clinicMemberRepository.findById(actor.clinicMemberId);

    if (member === null || !ALLOWED_ROLES.includes(member.role)) {
      throw new AccessDeniedException(
        "RECORD_SIGN_FORBIDDEN",
        AccessDeniedReason.INSUFFICIENT_PERMISSIONS,
      );
    }

    const record = await this.recordRepository.findById(payload.id);

    if (record === null) {
      throw new ResourceNotFoundException("Record not found.", payload.id.toString());
    }

    record.sign(actor.clinicMemberId);

    await this.recordRepository.save(record);
    this.eventDispatcher.dispatch(actor, record);

    return new RecordDto(record);
  }
}
