import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import type { ClinicalProfile } from "@domain/clinical-profile/entities";
import { EntityDto } from "@application/@shared/dto";

@ApiSchema({ name: "ClinicalProfile" })
export class ClinicalProfileDto extends EntityDto {
  @ApiProperty({ format: "uuid", description: "The clinic this profile belongs to" })
  clinicId: string;

  @ApiProperty({ format: "uuid", description: "The patient ID" })
  patientId: string;

  @ApiProperty({ format: "uuid", description: "ClinicMember who created/edited the profile" })
  createdByMemberId: string;

  @ApiProperty({ format: "uuid", description: "Professional clinically responsible" })
  responsibleProfessionalId: string;

  @ApiProperty({ nullable: true, description: "Known allergies" })
  allergies: string | null;

  @ApiProperty({ nullable: true, description: "Chronic conditions" })
  chronicConditions: string | null;

  @ApiProperty({ nullable: true, description: "Current medications" })
  currentMedications: string | null;

  @ApiProperty({ nullable: true, description: "Surgical history" })
  surgicalHistory: string | null;

  @ApiProperty({ nullable: true, description: "Family history" })
  familyHistory: string | null;

  @ApiProperty({ nullable: true, description: "Social history" })
  socialHistory: string | null;

  @ApiProperty({ nullable: true, description: "General notes" })
  generalNotes: string | null;

  constructor(profile: ClinicalProfile) {
    super(profile);
    this.clinicId = profile.clinicId.toString();
    this.patientId = profile.patientId.toString();
    this.createdByMemberId = profile.createdByMemberId.toString();
    this.responsibleProfessionalId = profile.responsibleProfessionalId.toString();
    this.allergies = profile.allergies;
    this.chronicConditions = profile.chronicConditions;
    this.currentMedications = profile.currentMedications;
    this.surgicalHistory = profile.surgicalHistory;
    this.familyHistory = profile.familyHistory;
    this.socialHistory = profile.socialHistory;
    this.generalNotes = profile.generalNotes;
  }
}
