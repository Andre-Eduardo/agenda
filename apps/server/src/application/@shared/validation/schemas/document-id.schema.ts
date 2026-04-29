import { z } from "zod";
import { DocumentId } from "@domain/@shared/value-objects";

export const documentId = z
  .string()
  .transform((value, ctx) => {
    try {
      return DocumentId.create(value);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid document ID",
      });

      return z.NEVER;
    }
  })
  .openapi({ example: "123.456.789-00" });
