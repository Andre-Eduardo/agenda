import type { ZodEffects, ZodString } from "zod";
import { z } from "zod";
import type { EntityId } from "@domain/@shared/entity/id";

type ParsableEntityId<T extends EntityId<string>> = { from: (value: string) => T };

export function entityId<T extends EntityId<string>>(
  id: ParsableEntityId<T>,
): ZodEffects<ZodString, T> {
  return z
    .string()
    .transform((value, ctx) => {
      try {
        return id.from(value);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Malformed ID. Expected a valid entity ID.",
        });

        return z.NEVER;
      }
    })
    .openapi({
      format: "uuid",
      example: "dc5782d4-ce8e-4f95-bb0b-d1a4e130aee8",
    });
}
