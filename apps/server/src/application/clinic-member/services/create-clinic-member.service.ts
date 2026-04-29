import { Injectable } from "@nestjs/common";
import { ClinicId } from "@domain/clinic/entities";
import { ClinicMember, ClinicMemberId } from "@domain/clinic-member/entities";
import { ClinicMemberRepository } from "@domain/clinic-member/clinic-member.repository";
import { EventDispatcher } from "@domain/event";
import { UserId } from "@domain/user/entities";
import { ApplicationService, Command } from "@application/@shared/application.service";
import { ClinicMemberDto, CreateClinicMemberDto } from "@application/clinic-member/dtos";

@Injectable()
export class CreateClinicMemberService implements ApplicationService<
  CreateClinicMemberDto,
  ClinicMemberDto
> {
  constructor(
    private readonly clinicMemberRepository: ClinicMemberRepository,
    private readonly eventDispatcher: EventDispatcher,
  ) {}

  async execute({ actor, payload }: Command<CreateClinicMemberDto>): Promise<ClinicMemberDto> {
    const member = ClinicMember.create({
      clinicId: ClinicId.from(payload.clinicId),
      userId: UserId.from(payload.userId),
      role: payload.role,
      displayName: payload.displayName ?? null,
      color: payload.color ?? null,
      isActive: true,
      invitedByMemberId: actor.clinicMemberId
        ? ClinicMemberId.from(actor.clinicMemberId.toString())
        : null,
    });

    await this.clinicMemberRepository.save(member);
    this.eventDispatcher.dispatch(actor, member);

    return new ClinicMemberDto(member);
  }
}
