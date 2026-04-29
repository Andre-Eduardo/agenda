import {
  AggregateRoot,
  type AllEntityProps,
  type CreateEntity,
  type EntityJson,
} from "@domain/@shared/entity";
import { EntityId } from "@domain/@shared/entity/id";
import { PreconditionException } from "@domain/@shared/exceptions";
import type { ClinicId } from "@domain/clinic/entities";
import type { ClinicMemberId } from "@domain/clinic-member/entities";
import type { PersonId } from "@domain/person/entities/person.entity";
import type { ImportedDocumentId } from "@domain/record/entities/imported-document.entity";
import type {
  RecordId,
  AttendanceType,
  ClinicalStatusTag,
  ConductTag,
  EvolutionTemplateType,
} from "@domain/record/entities/record.entity";
import { DraftApprovedEvent } from "@domain/draft-evolution/events/draft-approved.event";

export enum DraftEvolutionStatus {
  DRAFT = "DRAFT",
  PENDING_REVIEW = "PENDING_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export class DraftEvolution extends AggregateRoot<DraftEvolutionId> {
  clinicId: ClinicId;
  patientId: PersonId;
  createdByMemberId: ClinicMemberId;
  importedDocumentId: ImportedDocumentId | null;

  templateType: EvolutionTemplateType | null;
  title: string | null;
  attendanceType: AttendanceType | null;
  clinicalStatus: ClinicalStatusTag | null;
  conductTags: ConductTag[];
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  freeNotes: string | null;
  eventDate: Date | null;
  overallConfidence: number | null;

  status: DraftEvolutionStatus;
  wasHumanEdited: boolean;
  reviewRequired: boolean;

  approvedByMemberId: ClinicMemberId | null;
  approvedAt: Date | null;
  recordId: RecordId | null;

  constructor(props: AllEntityProps<DraftEvolution>) {
    super(props);
    this.clinicId = props.clinicId;
    this.patientId = props.patientId;
    this.createdByMemberId = props.createdByMemberId;
    this.importedDocumentId = props.importedDocumentId ?? null;
    this.templateType = props.templateType ?? null;
    this.title = props.title ?? null;
    this.attendanceType = props.attendanceType ?? null;
    this.clinicalStatus = props.clinicalStatus ?? null;
    this.conductTags = props.conductTags ?? [];
    this.subjective = props.subjective ?? null;
    this.objective = props.objective ?? null;
    this.assessment = props.assessment ?? null;
    this.plan = props.plan ?? null;
    this.freeNotes = props.freeNotes ?? null;
    this.eventDate = props.eventDate ?? null;
    this.overallConfidence = props.overallConfidence ?? null;
    this.status = props.status ?? DraftEvolutionStatus.DRAFT;
    this.wasHumanEdited = props.wasHumanEdited ?? false;
    this.reviewRequired = props.reviewRequired ?? true;
    this.approvedByMemberId = props.approvedByMemberId ?? null;
    this.approvedAt = props.approvedAt ?? null;
    this.recordId = props.recordId ?? null;
  }

  static create(props: CreateEntity<DraftEvolution>): DraftEvolution {
    const now = new Date();

    return new DraftEvolution({
      ...props,
      id: DraftEvolutionId.generate(),
      status: DraftEvolutionStatus.DRAFT,
      wasHumanEdited: false,
      templateType: props.templateType ?? null,
      title: props.title ?? null,
      importedDocumentId: props.importedDocumentId ?? null,
      overallConfidence: props.overallConfidence ?? null,
      attendanceType: props.attendanceType ?? null,
      clinicalStatus: props.clinicalStatus ?? null,
      subjective: props.subjective ?? null,
      objective: props.objective ?? null,
      assessment: props.assessment ?? null,
      plan: props.plan ?? null,
      freeNotes: props.freeNotes ?? null,
      eventDate: props.eventDate ?? null,
      reviewRequired: props.reviewRequired ?? true,
      approvedByMemberId: null,
      approvedAt: null,
      recordId: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  updateFields(
    fields: Partial<
      Pick<
        DraftEvolution,
        | "templateType"
        | "title"
        | "attendanceType"
        | "clinicalStatus"
        | "conductTags"
        | "subjective"
        | "objective"
        | "assessment"
        | "plan"
        | "freeNotes"
        | "eventDate"
      >
    >,
  ): void {
    if (
      this.status === DraftEvolutionStatus.APPROVED ||
      this.status === DraftEvolutionStatus.REJECTED
    ) {
      throw new PreconditionException("DRAFT_ALREADY_FINALIZED");
    }

    let changed = false;

    if (fields.templateType !== undefined) {
      this.templateType = fields.templateType;
      changed = true;
    }

    if (fields.title !== undefined) {
      this.title = fields.title;
      changed = true;
    }

    if (fields.attendanceType !== undefined) {
      this.attendanceType = fields.attendanceType;
      changed = true;
    }

    if (fields.clinicalStatus !== undefined) {
      this.clinicalStatus = fields.clinicalStatus;
      changed = true;
    }

    if (fields.conductTags !== undefined) {
      this.conductTags = fields.conductTags;
      changed = true;
    }

    if (fields.subjective !== undefined) {
      this.subjective = fields.subjective;
      changed = true;
    }

    if (fields.objective !== undefined) {
      this.objective = fields.objective;
      changed = true;
    }

    if (fields.assessment !== undefined) {
      this.assessment = fields.assessment;
      changed = true;
    }

    if (fields.plan !== undefined) {
      this.plan = fields.plan;
      changed = true;
    }

    if (fields.freeNotes !== undefined) {
      this.freeNotes = fields.freeNotes;
      changed = true;
    }

    if (fields.eventDate !== undefined) {
      this.eventDate = fields.eventDate;
      changed = true;
    }

    if (changed) {
      this.wasHumanEdited = true;
      this.updatedAt = new Date();

      if (this.status === DraftEvolutionStatus.DRAFT) {
        this.status = DraftEvolutionStatus.PENDING_REVIEW;
      }
    }
  }

  approve(memberId: ClinicMemberId, recordId: RecordId): void {
    if (this.status === DraftEvolutionStatus.APPROVED) {
      throw new PreconditionException("DRAFT_ALREADY_APPROVED");
    }

    if (this.status === DraftEvolutionStatus.REJECTED) {
      throw new PreconditionException("DRAFT_ALREADY_REJECTED");
    }

    const now = new Date();

    this.status = DraftEvolutionStatus.APPROVED;
    this.approvedByMemberId = memberId;
    this.approvedAt = now;
    this.recordId = recordId;
    this.updatedAt = now;

    this.addEvent(
      new DraftApprovedEvent({
        draftId: this.id,
        recordId,
        approvedByMemberId: memberId,
        timestamp: now,
      }),
    );
  }

  toJSON(): EntityJson<DraftEvolution> {
    return {
      id: this.id.toJSON(),
      clinicId: this.clinicId.toJSON(),
      patientId: this.patientId.toJSON(),
      createdByMemberId: this.createdByMemberId.toJSON(),
      importedDocumentId: this.importedDocumentId?.toJSON() ?? null,
      templateType: this.templateType,
      title: this.title,
      attendanceType: this.attendanceType,
      clinicalStatus: this.clinicalStatus,
      conductTags: this.conductTags,
      subjective: this.subjective,
      objective: this.objective,
      assessment: this.assessment,
      plan: this.plan,
      freeNotes: this.freeNotes,
      eventDate: this.eventDate?.toJSON() ?? null,
      overallConfidence: this.overallConfidence,
      status: this.status,
      wasHumanEdited: this.wasHumanEdited,
      reviewRequired: this.reviewRequired,
      approvedByMemberId: this.approvedByMemberId?.toJSON() ?? null,
      approvedAt: this.approvedAt?.toJSON() ?? null,
      recordId: this.recordId?.toJSON() ?? null,
      createdAt: this.createdAt.toJSON(),
      updatedAt: this.updatedAt.toJSON(),
      deletedAt: this.deletedAt?.toJSON() ?? null,
    };
  }
}

export class DraftEvolutionId extends EntityId<"DraftEvolutionId"> {
  static from(value: string): DraftEvolutionId {
    return new DraftEvolutionId(value);
  }

  static generate(): DraftEvolutionId {
    return new DraftEvolutionId();
  }
}
