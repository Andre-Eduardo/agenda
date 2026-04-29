import { z } from "zod";
import { createZodDto } from "@application/@shared/validation/dto";
import { password } from "@application/@shared/validation/schemas";

const changeUserPasswordSchema = z.object({
  oldPassword: z.string().min(1).openapi({ example: "J0hn@d02" }),
  newPassword: password,
});

export class ChangeUserPasswordDto extends createZodDto(changeUserPasswordSchema) {}
