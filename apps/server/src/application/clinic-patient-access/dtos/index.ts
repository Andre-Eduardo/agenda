import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { createZodDto } from "@application/@shared/validation/dto";
import { z } from "zod";
import { ClinicPatientAccess, PatientAccessLevel } from "@domain/clinic-patient-access/entities";
import { EntityDto } from "@application/@shared/dto";

export const grantAccessSchema = z.object({
  clinicId: z.string().uuid(),
  memberId: z.string().uuid(),
  patientId: z.string().uuid(),
  accessLevel: z.nativeEnum(PatientAccessLevel),
  reason: z.string().nullish(),
});

export class GrantClinicPatientAccessDto extends createZodDto(grantAccessSchema) {}

@ApiSchema({ name: "ClinicPatientAccess" })
export class ClinicPatientAccessDto extends EntityDto {
  @ApiProperty({ format: "uuid" }) clinicId: string;
  @ApiProperty({ format: "uuid" }) memberId: string;
  @ApiProperty({ format: "uuid" }) patientId: string;
  @ApiProperty({ enum: PatientAccessLevel }) accessLevel: PatientAccessLevel;
  @ApiProperty({ nullable: true }) reason: string | null;

  constructor(access: ClinicPatientAccess) {
    super(access);
    this.clinicId = access.clinicId.toString();
    this.memberId = access.memberId.toString();
    this.patientId = access.patientId.toString();
    this.accessLevel = access.accessLevel;
    this.reason = access.reason;
  }
}
