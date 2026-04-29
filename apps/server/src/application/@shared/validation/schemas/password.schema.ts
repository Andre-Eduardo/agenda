import { z } from "zod";
import { ObfuscatedPassword } from "@domain/user/value-objects";

export const password = z
  .string()
  .transform((value, ctx) => {
    try {
      ObfuscatedPassword.validate(value);

      return value;
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error instanceof Error ? error.message : "Invalid password format",
      });

      return z.NEVER;
    }
  })
  .openapi({
    example: "J0hn@d03",
  });
