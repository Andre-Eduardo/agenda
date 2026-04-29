import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import type { MemberBlock } from "@domain/professional/entities";
import { EntityDto } from "@application/@shared/dto";

@ApiSchema({ name: "MemberBlock" })
export class MemberBlockDto extends EntityDto {
  @ApiProperty({ format: "uuid", description: "The clinic member this block belongs to" })
  clinicMemberId: string;

  @ApiProperty({ format: "date-time", description: "Block start date/time" })
  startAt: string;

  @ApiProperty({ format: "date-time", description: "Block end date/time" })
  endAt: string;

  @ApiProperty({ nullable: true, description: "Optional reason for the block" })
  reason: string | null;

  constructor(block: MemberBlock) {
    super(block);
    this.clinicMemberId = block.clinicMemberId.toString();
    this.startAt = block.startAt.toISOString();
    this.endAt = block.endAt.toISOString();
    this.reason = block.reason;
  }
}
