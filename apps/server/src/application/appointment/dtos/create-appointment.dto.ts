import { z } from "zod";
import { ClinicMemberId } from "@domain/clinic-member/entities";
import { PatientId } from "@domain/patient/entities";
import { AppointmentType } from "@domain/appointment/entities";
import { createZodDto } from "@application/@shared/validation/dto";
import { datetime, entityId } from "@application/@shared/validation/schemas";

export const createAppointmentSchema = z.object({
  patientId: entityId(PatientId),
  /** ClinicMember who will attend the appointment (typically a PROFESSIONAL). */
  attendedByMemberId: entityId(ClinicMemberId),
  startAt: datetime,
  endAt: datetime,
  type: z.nativeEnum(AppointmentType),
  note: z.string().nullish().openapi({ example: "Patient has allergy to penicillin" }),
  retroactive: z.boolean().optional(),
});

export class CreateAppointmentDto extends createZodDto(createAppointmentSchema) {}
