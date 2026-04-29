import {
  AggregateRoot,
  type AllEntityProps,
  type EntityJson,
  type EntityProps,
  type CreateEntity,
} from "@domain/@shared/entity";
import { EntityId } from "@domain/@shared/entity/id";
import type { ClinicId } from "@domain/clinic/entities";
import type { ClinicMemberId } from "@domain/clinic-member/entities";
import type { PatientId } from "@domain/patient/entities";
import type { ProfessionalId } from "@domain/professional/entities";
import {
  ClinicalProfileCreatedEvent,
  ClinicalProfileChangedEvent,
} from "@domain/clinical-profile/events";

export type ClinicalProfileProps = EntityProps<ClinicalProfile>;
export type CreateClinicalProfile = CreateEntity<ClinicalProfile>;
export type UpdateClinicalProfile = Partial<ClinicalProfileProps>;

export class ClinicalProfile extends AggregateRoot<ClinicalProfileId> {
  clinicId: ClinicId;
  patientId: PatientId;
  createdByMemberId: ClinicMemberId;
  /** Profissional clinicamente responsável (≠ quem digitou). */
  responsibleProfessionalId: ProfessionalId;
  allergies: string | null;
  chronicConditions: string | null;
  currentMedications: string | null;
  surgicalHistory: string | null;
  familyHistory: string | null;
  socialHistory: string | null;
  generalNotes: string | null;

  constructor(props: AllEntityProps<ClinicalProfile>) {
    super(props);
    this.clinicId = props.clinicId;
    this.patientId = props.patientId;
    this.createdByMemberId = props.createdByMemberId;
    this.responsibleProfessionalId = props.responsibleProfessionalId;
    this.allergies = props.allergies ?? null;
    this.chronicConditions = props.chronicConditions ?? null;
    this.currentMedications = props.currentMedications ?? null;
    this.surgicalHistory = props.surgicalHistory ?? null;
    this.familyHistory = props.familyHistory ?? null;
    this.socialHistory = props.socialHistory ?? null;
    this.generalNotes = props.generalNotes ?? null;
  }

  static create(props: CreateClinicalProfile): ClinicalProfile {
    const now = new Date();

    const profile = new ClinicalProfile({
      ...props,
      id: ClinicalProfileId.generate(),
      allergies: props.allergies ?? null,
      chronicConditions: props.chronicConditions ?? null,
      currentMedications: props.currentMedications ?? null,
      surgicalHistory: props.surgicalHistory ?? null,
      familyHistory: props.familyHistory ?? null,
      socialHistory: props.socialHistory ?? null,
      generalNotes: props.generalNotes ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    profile.addEvent(new ClinicalProfileCreatedEvent({ profile, timestamp: now }));

    return profile;
  }

  change(props: UpdateClinicalProfile): void {
    const oldState = new ClinicalProfile(this);

    if (props.allergies !== undefined) {
      this.allergies = props.allergies;
    }

    if (props.chronicConditions !== undefined) {
      this.chronicConditions = props.chronicConditions;
    }

    if (props.currentMedications !== undefined) {
      this.currentMedications = props.currentMedications;
    }

    if (props.surgicalHistory !== undefined) {
      this.surgicalHistory = props.surgicalHistory;
    }

    if (props.familyHistory !== undefined) {
      this.familyHistory = props.familyHistory;
    }

    if (props.socialHistory !== undefined) {
      this.socialHistory = props.socialHistory;
    }

    if (props.generalNotes !== undefined) {
      this.generalNotes = props.generalNotes;
    }

    this.addEvent(new ClinicalProfileChangedEvent({ oldState, newState: this }));
  }

  toJSON(): EntityJson<ClinicalProfile> {
    return {
      id: this.id.toJSON(),
      clinicId: this.clinicId.toJSON(),
      patientId: this.patientId.toJSON(),
      createdByMemberId: this.createdByMemberId.toJSON(),
      responsibleProfessionalId: this.responsibleProfessionalId.toJSON(),
      allergies: this.allergies,
      chronicConditions: this.chronicConditions,
      currentMedications: this.currentMedications,
      surgicalHistory: this.surgicalHistory,
      familyHistory: this.familyHistory,
      socialHistory: this.socialHistory,
      generalNotes: this.generalNotes,
      createdAt: this.createdAt.toJSON(),
      updatedAt: this.updatedAt.toJSON(),
      deletedAt: this.deletedAt?.toJSON() ?? null,
    };
  }
}

export class ClinicalProfileId extends EntityId<"ClinicalProfileId"> {
  static from(value: string): ClinicalProfileId {
    return new ClinicalProfileId(value);
  }

  static generate(): ClinicalProfileId {
    return new ClinicalProfileId();
  }
}
