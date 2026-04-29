import { z } from "zod";
import { PatientId } from "@domain/patient/entities";
import { createZodDto } from "@application/@shared/validation/dto";
import { entityId } from "@application/@shared/validation/schemas";

export const getPatientSchema = z.object({
  id: entityId(PatientId),
});

export class GetPatientDto extends createZodDto(getPatientSchema) {}
