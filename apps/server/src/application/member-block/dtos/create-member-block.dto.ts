import { z } from "zod";
import { createZodDto } from "@application/@shared/validation/dto";

export const createMemberBlockSchema = z
  .object({
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    reason: z.string().max(500).nullish(),
  })
  .refine((data) => data.endAt > data.startAt, {
    message: "endAt must be after startAt",
    path: ["endAt"],
  });

export class CreateMemberBlockDto extends createZodDto(createMemberBlockSchema) {}
