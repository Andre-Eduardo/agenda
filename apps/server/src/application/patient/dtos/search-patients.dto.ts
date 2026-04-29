import { z } from "zod";
import { createZodDto } from "@application/@shared/validation/dto";
import { pagination } from "@application/@shared/validation/schemas";

export const searchPatientsSchema = pagination(["createdAt", "updatedAt"] as const).extend({
  term: z
    .string()
    .optional()
    .openapi({ description: "Search term to filter by name or document ID" }),
});

export class SearchPatientsDto extends createZodDto(searchPatientsSchema) {}
