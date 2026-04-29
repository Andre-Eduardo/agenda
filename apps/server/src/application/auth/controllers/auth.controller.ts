import { Body, Controller, HttpCode, Post, Res, HttpStatus } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { Actor, UnauthenticatedActor } from "@domain/@shared/actor";
import { Public } from "@application/@shared/auth";
import { BypassClinicMember } from "@application/@shared/auth/bypass-clinic-member.decorator";
import { RequestActor } from "@application/@shared/auth/request-actor.decorator";
import { ApiOperation } from "@application/@shared/openapi/decorators";
import { SignInDto } from "@application/auth/dtos";
import { SignInService, SignOutService } from "@application/auth/services";

@BypassClinicMember()
@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly signInService: SignInService,
    private readonly signOutService: SignOutService,
  ) {}

  @ApiOperation({
    summary: "Signs in to a user",
    responses: [
      {
        status: 200,
        description: "User signed in",
        headers: {
          "Set-Cookie": {
            description: "The authentication token",
            schema: { type: "string" },
          },
        },
      },
    ],
  })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("/sign-in")
  async signIn(
    @RequestActor() actor: UnauthenticatedActor,
    @Body() payload: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const { token, clinicMemberId } = await this.signInService.execute({ actor, payload });

    response.actions.setToken(token);

    if (clinicMemberId !== undefined) {
      response.actions.setClinicMember(clinicMemberId);
    }
  }

  @ApiOperation({
    summary: "Signs out a user",
    responses: [
      {
        status: 200,
        description: "User signed out",
        headers: {
          "Set-Cookie": {
            description: "Expires the authentication token",
            schema: { type: "string" },
          },
        },
      },
    ],
  })
  @HttpCode(HttpStatus.OK)
  @Post("/sign-out")
  async signOut(
    @RequestActor() actor: Actor,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.signOutService.execute({ actor, payload: undefined });

    response.actions.setToken(null);
  }
}
