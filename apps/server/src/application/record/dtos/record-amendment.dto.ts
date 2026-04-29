import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { EntityDto } from "@application/@shared/dto";
import type { RecordAmendment } from "@domain/record/entities/record-amendment.entity";

@ApiSchema({ name: "RecordAmendment" })
export class RecordAmendmentDto extends EntityDto {
  @ApiProperty({ format: "uuid" })
  clinicId: string;

  @ApiProperty({ format: "uuid" })
  recordId: string;

  @ApiProperty({ format: "uuid" })
  requestedByMemberId: string;

  @ApiProperty()
  justification: string;

  @ApiProperty({ format: "date-time" })
  reopenedAt: string;

  @ApiProperty({ format: "date-time", nullable: true })
  relockedAt: string | null;

  constructor(amendment: RecordAmendment) {
    super(amendment);
    this.clinicId = amendment.clinicId.toString();
    this.recordId = amendment.recordId.toString();
    this.requestedByMemberId = amendment.requestedByMemberId.toString();
    this.justification = amendment.justification;
    this.reopenedAt = amendment.reopenedAt.toISOString();
    this.relockedAt = amendment.relockedAt?.toISOString() ?? null;
  }
}
