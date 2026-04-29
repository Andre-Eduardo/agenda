import { z } from "zod";
import { createZodDto } from "@application/@shared/validation/dto";
import { pagination } from "@application/@shared/validation/schemas";

export const searchAppointmentsSchema = pagination([
  "createdAt",
  "updatedAt",
  "startAt",
] as const).extend({
  term: z
    .string()
    .optional()
    .openapi({ description: "Search term to filter appointments by note" }),
});

export class SearchAppointmentsDto extends createZodDto(searchAppointmentsSchema) {}
