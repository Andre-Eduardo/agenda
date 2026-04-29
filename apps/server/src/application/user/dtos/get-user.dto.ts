import { z } from "zod";
import { UserId } from "@domain/user/entities";
import { createZodDto } from "@application/@shared/validation/dto";
import { entityId } from "@application/@shared/validation/schemas";

export const getUserSchema = z.object({
  id: entityId(UserId),
});

export class GetUserDto extends createZodDto(getUserSchema) {}
