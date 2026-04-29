import { z } from "zod";
import { RecordId } from "@domain/record/entities";
import { createZodDto } from "@application/@shared/validation/dto";
import { entityId } from "@application/@shared/validation/schemas";

export const reopenRecordSchema = z.object({
  id: entityId(RecordId),
  justification: z.string().min(1).max(2000),
});

export class ReopenRecordDto extends createZodDto(reopenRecordSchema) {}

export const reopenRecordBodySchema = reopenRecordSchema.pick({ justification: true });
export class ReopenRecordBodyDto extends createZodDto(reopenRecordBodySchema) {}
