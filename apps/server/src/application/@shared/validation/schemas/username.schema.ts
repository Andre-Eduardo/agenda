import { z } from "zod";
import { Username } from "@domain/user/value-objects";

export const username = z
  .string()
  .transform((value, ctx) => {
    try {
      return Username.create(value);
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error instanceof Error ? error.message : "Invalid username format",
      });

      return z.NEVER;
    }
  })
  .openapi({
    example: "john_doe",
  });
