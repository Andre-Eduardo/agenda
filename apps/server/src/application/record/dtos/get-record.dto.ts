import { z } from "zod";
import { RecordId } from "@domain/record/entities";
import { createZodDto } from "@application/@shared/validation/dto";
import { entityId } from "@application/@shared/validation/schemas";

export const getRecordSchema = z.object({
  id: entityId(RecordId),
});

export class GetRecordDto extends createZodDto(getRecordSchema) {}
