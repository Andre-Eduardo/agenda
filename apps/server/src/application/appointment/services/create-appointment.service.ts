import { Injectable } from "@nestjs/common";
import {
  InvalidInputException,
  PreconditionException,
  ResourceNotFoundException,
} from "@domain/@shared/exceptions";
import { Appointment } from "@domain/appointment/entities";
import { AppointmentRepository } from "@domain/appointment/appointment.repository";
import { ClinicMemberRepository } from "@domain/clinic-member/clinic-member.repository";
import { EventDispatcher } from "@domain/event";
import { PatientRepository } from "@domain/patient/patient.repository";
import { MemberBlockRepository } from "@domain/professional/member-block.repository";
import { WorkingHoursRepository } from "@domain/professional/working-hours.repository";
import { ApplicationService, Command } from "@application/@shared/application.service";
import { AppointmentDto, CreateAppointmentDto } from "@application/appointment/dtos";

@Injectable()
export class CreateAppointmentService implements ApplicationService<
  CreateAppointmentDto,
  AppointmentDto
> {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly clinicMemberRepository: ClinicMemberRepository,
    private readonly patientRepository: PatientRepository,
    private readonly workingHoursRepository: WorkingHoursRepository,
    private readonly memberBlockRepository: MemberBlockRepository,
    private readonly eventDispatcher: EventDispatcher,
  ) {}

  async execute({ actor, payload }: Command<CreateAppointmentDto>): Promise<AppointmentDto> {
    const { patientId, attendedByMemberId, startAt, endAt, type, note, retroactive } = payload;

    // 1. Member who will attend must exist and belong to the actor's clinic.
    const attendedBy = await this.clinicMemberRepository.findById(attendedByMemberId);

    if (attendedBy === null) {
      throw new ResourceNotFoundException("clinic_member.not_found", attendedByMemberId.toString());
    }

    if (!attendedBy.clinicId.equals(actor.clinicId)) {
      throw new PreconditionException("Member does not belong to the current clinic.");
    }

    // 2. Patient must exist and belong to the same clinic (tenant boundary).
    const patient = await this.patientRepository.findById(patientId, actor.clinicId);

    if (patient === null) {
      throw new ResourceNotFoundException("patient.not_found", patientId.toString());
    }

    // 3. Time interval must be coherent.
    if (startAt >= endAt) {
      throw new InvalidInputException("endAt must be after startAt", [
        { field: "endAt", reason: "endAt must be after startAt" },
      ]);
    }

    // 4. Don't allow scheduling in the past unless explicitly marked retroactive.
    if (!retroactive && startAt < new Date()) {
      throw new InvalidInputException("startAt cannot be in the past", [
        { field: "startAt", reason: "startAt cannot be in the past" },
      ]);
    }

    // 5. Member must have working hours covering the interval (when defined).
    const dayOfWeek = startAt.getDay();
    const workingHours = await this.workingHoursRepository.findByMemberAndDay(
      attendedByMemberId,
      dayOfWeek,
    );

    if (workingHours.length > 0) {
      const coversInterval = workingHours.some((wh) => wh.coversInterval(startAt, endAt));

      if (!coversInterval) {
        throw new PreconditionException("Appointment is outside the member working hours.");
      }
    }

    // 6. Member must not have a block overlapping the interval.
    const blocks = await this.memberBlockRepository.findOverlapping(
      attendedByMemberId,
      startAt,
      endAt,
    );

    if (blocks.length > 0) {
      throw new PreconditionException("Member has a block during this time period.");
    }

    // 7. No conflict with other active appointments for the same member.
    const conflicts = await this.appointmentRepository.findConflicts(
      attendedByMemberId,
      startAt,
      endAt,
    );

    if (conflicts.length > 0) {
      throw new PreconditionException(
        "There is a scheduling conflict with an existing appointment.",
      );
    }

    // 8. Compute durationMinutes and persist.
    const durationMinutes = Math.round((endAt.getTime() - startAt.getTime()) / 60_000);

    const appointment = Appointment.create({
      clinicId: actor.clinicId,
      patientId,
      attendedByMemberId,
      createdByMemberId: actor.clinicMemberId,
      startAt,
      endAt,
      durationMinutes,
      type,
      note: note ?? null,
    });

    await this.appointmentRepository.save(appointment);

    this.eventDispatcher.dispatch(actor, appointment);

    return new AppointmentDto(appointment);
  }
}
