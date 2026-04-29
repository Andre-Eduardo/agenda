import { Injectable } from "@nestjs/common";
import { ResourceNotFoundException } from "@domain/@shared/exceptions";
import { ClinicMemberRepository } from "@domain/clinic-member/clinic-member.repository";
import { ClinicMemberRole } from "@domain/clinic-member/entities";
import { EventDispatcher } from "@domain/event";
import { Professional } from "@domain/professional/entities";
import { ProfessionalRepository } from "@domain/professional/professional.repository";
import { ApplicationService, Command } from "@application/@shared/application.service";
import { CreateProfessionalDto, ProfessionalDto } from "@application/professional/dtos";

@Injectable()
export class CreateProfessionalService implements ApplicationService<
  CreateProfessionalDto,
  ProfessionalDto
> {
  constructor(
    private readonly professionalRepository: ProfessionalRepository,
    private readonly clinicMemberRepository: ClinicMemberRepository,
    private readonly eventDispatcher: EventDispatcher,
  ) {}

  async execute({ actor, payload }: Command<CreateProfessionalDto>): Promise<ProfessionalDto> {
    const member = await this.clinicMemberRepository.findById(payload.clinicMemberId);

    if (member === null) {
      throw new ResourceNotFoundException(
        "clinic_member.not_found",
        payload.clinicMemberId.toString(),
      );
    }

    if (member.role !== ClinicMemberRole.PROFESSIONAL) {
      // Professional records require the linked member to be a PROFESSIONAL.
      // Owners/admins/secretaries can edit clinical data via permissions, but only
      // professionals can be clinically responsible (responsibleProfessionalId).
      throw new ResourceNotFoundException(
        "clinic_member.role_mismatch",
        `Member ${member.id.toString()} has role ${member.role}, expected PROFESSIONAL.`,
      );
    }

    const professional = Professional.create({
      clinicMemberId: payload.clinicMemberId,
      registrationNumber: payload.registrationNumber ?? null,
      specialty: payload.specialty ?? null,
      specialtyNormalized: payload.specialtyNormalized ?? null,
    });

    await this.professionalRepository.save(professional);

    this.eventDispatcher.dispatch(actor, professional);

    return new ProfessionalDto(professional);
  }
}
