import type { ApiParamOptions } from "@nestjs/swagger";

export const entityIdParam = (description: string, name = "id"): ApiParamOptions => ({
  name,
  description,
  type: "string",
  format: "uuid",
  required: true,
});
