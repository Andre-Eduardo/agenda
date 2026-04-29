import { z } from "zod";
import { createZodDto } from "@application/@shared/validation/dto";

export const uploadLocalSchema = z.object({
  tempPath: z.string().min(1),
});

export type UploadLocalDto = z.infer<typeof uploadLocalSchema>;

export class UploadLocalInputDto extends createZodDto(uploadLocalSchema) {}
