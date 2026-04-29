import { z } from "zod";
import { createZodDto } from "@application/@shared/validation/dto";

export const listMemberBlocksSchema = z.object({
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
});

export class ListMemberBlocksDto extends createZodDto(listMemberBlocksSchema) {}
