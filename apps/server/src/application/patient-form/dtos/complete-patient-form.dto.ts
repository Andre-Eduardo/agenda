import { z } from "zod";
import { PatientFormId } from "@domain/patient-form/entities";
import { createZodDto } from "@application/@shared/validation/dto";

const answerSchema = z.object({
  fieldId: z.string().min(1),
  valueText: z.string().nullish(),
  valueNumber: z.number().nullish(),
  valueBoolean: z.boolean().nullish(),
  valueDate: z.string().nullish(),
  valueJson: z.unknown().optional(),
});

const completePatientFormSchema = z.object({
  answers: z.array(answerSchema),
  linkToRecordId: z.string().uuid().nullish(),
});

export class CompletePatientFormInputDto extends createZodDto(completePatientFormSchema) {}

export type CompletePatientFormDto = z.infer<typeof completePatientFormSchema> & {
  patientFormId: PatientFormId;
};
