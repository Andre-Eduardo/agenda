import { Injectable } from "@nestjs/common";
import { PreconditionException, ResourceNotFoundException } from "@domain/@shared/exceptions";
import { ClinicMemberId } from "@domain/clinic-member/entities";
import { WorkingHoursId } from "@domain/professional/entities";
import { WorkingHoursRepository } from "@domain/professional/working-hours.repository";
import { ClinicMemberRepository } from "@domain/clinic-member/clinic-member.repository";
import { ApplicationService, Command } from "@application/@shared/application.service";

type DeleteWorkingHoursPayload = { memberId: ClinicMemberId; hoursId: WorkingHoursId };

@Injectable()
export class DeleteWorkingHoursService implements ApplicationService<DeleteWorkingHoursPayload> {
  constructor(
    private readonly workingHoursRepository: WorkingHoursRepository,
    private readonly clinicMemberRepository: ClinicMemberRepository,
  ) {}

  async execute({ actor, payload }: Command<DeleteWorkingHoursPayload>): Promise<void> {
    const { memberId, hoursId } = payload;

    const member = await this.clinicMemberRepository.findById(memberId);

    if (member === null) {
      throw new ResourceNotFoundException("clinic_member.not_found", memberId.toString());
    }

    if (!member.clinicId.equals(actor.clinicId)) {
      throw new PreconditionException("Member does not belong to the current clinic.");
    }

    const workingHours = await this.workingHoursRepository.findById(hoursId);

    if (workingHours === null) {
      throw new ResourceNotFoundException("working_hours.not_found", hoursId.toString());
    }

    if (!workingHours.clinicMemberId.equals(memberId)) {
      throw new PreconditionException("Working hours do not belong to the specified member.");
    }

    await this.workingHoursRepository.delete(hoursId);
  }
}
