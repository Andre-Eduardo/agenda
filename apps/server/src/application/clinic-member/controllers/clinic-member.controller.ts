import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Actor } from "@domain/@shared/actor";
import { ClinicId } from "@domain/clinic/entities";
import { RequestActor } from "@application/@shared/auth/request-actor.decorator";
import { BypassClinicMember } from "@application/@shared/auth/bypass-clinic-member.decorator";
import { ApiOperation } from "@application/@shared/openapi/decorators";
import { ClinicMemberDto, CreateClinicMemberDto } from "@application/clinic-member/dtos";
import {
  CreateClinicMemberService,
  ListClinicMembersService,
} from "@application/clinic-member/services";

@ApiTags("ClinicMember")
@Controller("clinic-members")
export class ClinicMemberController {
  constructor(
    private readonly createClinicMemberService: CreateClinicMemberService,
    private readonly listClinicMembersService: ListClinicMembersService,
  ) {}

  @ApiOperation({
    summary: "Adds a new member to a clinic",
    responses: [{ status: 201, description: "Member created", type: ClinicMemberDto }],
  })
  @BypassClinicMember()
  @Post()
  createClinicMember(
    @RequestActor() actor: Actor,
    @Body() payload: CreateClinicMemberDto,
  ): Promise<ClinicMemberDto> {
    return this.createClinicMemberService.execute({ actor, payload });
  }

  @ApiOperation({
    summary: "List members of a clinic",
    responses: [{ status: 200, description: "Members list", type: ClinicMemberDto, isArray: true }],
  })
  @Get()
  listClinicMembers(
    @RequestActor() actor: Actor,
    @Query("clinicId") clinicId: string,
  ): Promise<ClinicMemberDto[]> {
    return this.listClinicMembersService.execute({
      actor,
      payload: { clinicId: ClinicId.from(clinicId) },
    });
  }
}
