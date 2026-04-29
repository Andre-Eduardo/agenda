import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import type { ClinicMember } from "@domain/clinic-member/entities";
import { ClinicMemberRole } from "@domain/clinic-member/entities";
import { EntityDto } from "@application/@shared/dto";

@ApiSchema({ name: "ClinicMember" })
export class ClinicMemberDto extends EntityDto {
  @ApiProperty({ format: "uuid", description: "Clinic id" })
  clinicId: string;

  @ApiProperty({ format: "uuid", description: "User id" })
  userId: string;

  @ApiProperty({ enum: ClinicMemberRole, description: "Role inside the clinic" })
  role: ClinicMemberRole;

  @ApiProperty({ nullable: true, description: "Display name (UI label)" })
  displayName: string | null;

  @ApiProperty({ nullable: true, description: "Calendar color" })
  color: string | null;

  @ApiProperty({ description: "Is the membership active" })
  isActive: boolean;

  @ApiProperty({ format: "uuid", nullable: true, description: "Inviter member id" })
  invitedByMemberId: string | null;

  constructor(member: ClinicMember) {
    super(member);
    this.clinicId = member.clinicId.toString();
    this.userId = member.userId.toString();
    this.role = member.role;
    this.displayName = member.displayName;
    this.color = member.color;
    this.isActive = member.isActive;
    this.invitedByMemberId = member.invitedByMemberId?.toString() ?? null;
  }
}
