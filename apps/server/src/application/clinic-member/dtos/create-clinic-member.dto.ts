import { createZodDto } from "@application/@shared/validation/dto";
import { z } from "zod";
import { ClinicMemberRole } from "@domain/clinic-member/entities";

export const createClinicMemberSchema = z.object({
  clinicId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.nativeEnum(ClinicMemberRole),
  displayName: z.string().nullish(),
  color: z.string().nullish(),
});

export class CreateClinicMemberDto extends createZodDto(createClinicMemberSchema) {}
