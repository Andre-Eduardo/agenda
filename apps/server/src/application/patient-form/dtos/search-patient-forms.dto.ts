import { z } from "zod";
import { PatientId } from "@domain/patient/entities";
import { AiSpecialtyGroup } from "@domain/form-template/entities";
import { FormResponseStatus } from "@domain/patient-form/entities";
import { createZodDto } from "@application/@shared/validation/dto";
import { entityId } from "@application/@shared/validation/schemas";
import { pagination } from "@application/@shared/validation/schemas/pagination.schema";

export const searchPatientFormsSchema = z
  .object({
    specialty: z.nativeEnum(AiSpecialtyGroup).optional(),
    status: z.nativeEnum(FormResponseStatus).optional(),
  })
  .merge(pagination(["appliedAt", "createdAt", "updatedAt", "completedAt"]));

export class SearchPatientFormsDto extends createZodDto(searchPatientFormsSchema) {}

export const patientFormPatientParamSchema = z.object({
  patientId: entityId(PatientId),
});
