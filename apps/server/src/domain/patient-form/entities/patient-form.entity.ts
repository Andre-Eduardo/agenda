import { AggregateRoot, type AllEntityProps, type CreateEntity } from "@domain/@shared/entity";
import { EntityId } from "@domain/@shared/entity/id";
import { PreconditionException } from "@domain/@shared/exceptions";
import type { ClinicId } from "@domain/clinic/entities";
import type { ClinicMemberId } from "@domain/clinic-member/entities";
import type { PatientId } from "@domain/patient/entities";
import type { ProfessionalId } from "@domain/professional/entities";
import type { FormTemplateId } from "@domain/form-template/entities";
import type { FormTemplateVersionId } from "@domain/form-template-version/entities";
import type { FormResponseJson, FormComputedJson } from "@domain/form-template/types";
import { PatientFormCompletedEvent } from "@domain/patient-form/events";

export enum FormResponseStatus {
  DRAFT = "DRAFT",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export type CreatePatientForm = CreateEntity<PatientForm>;

export class PatientForm extends AggregateRoot<PatientFormId> {
  clinicId: ClinicId;
  patientId: PatientId;
  /** Membro que aplicou/preencheu o formulário. */
  createdByMemberId: ClinicMemberId;
  /** Profissional clinicamente responsável (opcional para forms aplicados por SECRETARY). */
  responsibleProfessionalId: ProfessionalId | null;
  templateId: FormTemplateId;
  versionId: FormTemplateVersionId;
  status: FormResponseStatus;
  responseJson: FormResponseJson;
  computedJson: FormComputedJson | null;
  appliedAt: Date;
  completedAt: Date | null;

  constructor(props: AllEntityProps<PatientForm>) {
    super(props);
    this.clinicId = props.clinicId;
    this.patientId = props.patientId;
    this.createdByMemberId = props.createdByMemberId;
    this.responsibleProfessionalId = props.responsibleProfessionalId ?? null;
    this.templateId = props.templateId;
    this.versionId = props.versionId;
    this.status = props.status ?? FormResponseStatus.IN_PROGRESS;
    this.responseJson = props.responseJson ?? { answers: [] };
    this.computedJson = props.computedJson ?? null;
    this.appliedAt = props.appliedAt;
    this.completedAt = props.completedAt ?? null;
  }

  static create(props: CreatePatientForm): PatientForm {
    const now = new Date();

    return new PatientForm({
      ...props,
      id: PatientFormId.generate(),
      responsibleProfessionalId: props.responsibleProfessionalId ?? null,
      status: props.status ?? FormResponseStatus.IN_PROGRESS,
      responseJson: props.responseJson ?? { answers: [] },
      computedJson: null,
      appliedAt: props.appliedAt ?? now,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  saveDraft(responseJson: FormResponseJson): void {
    if (this.status === FormResponseStatus.COMPLETED) {
      throw new PreconditionException("Cannot edit a completed form.");
    }

    if (this.status === FormResponseStatus.CANCELLED) {
      throw new PreconditionException("Cannot edit a cancelled form.");
    }

    this.responseJson = responseJson;
    this.status = FormResponseStatus.DRAFT;
    this.updatedAt = new Date();
  }

  complete(responseJson: FormResponseJson, computedJson?: FormComputedJson): void {
    if (this.status === FormResponseStatus.COMPLETED) {
      throw new PreconditionException("Form is already completed.");
    }

    if (this.status === FormResponseStatus.CANCELLED) {
      throw new PreconditionException("Cannot complete a cancelled form.");
    }

    const now = new Date();

    this.responseJson = responseJson;
    this.computedJson = computedJson ?? null;
    this.status = FormResponseStatus.COMPLETED;
    this.completedAt = now;
    this.updatedAt = now;
    this.addEvent(
      new PatientFormCompletedEvent({ formId: this.id, patientId: this.patientId, timestamp: now }),
    );
  }

  cancel(): void {
    if (this.status === FormResponseStatus.COMPLETED) {
      throw new PreconditionException("Cannot cancel a completed form.");
    }

    this.status = FormResponseStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  setComputedJson(computedJson: FormComputedJson): void {
    this.computedJson = computedJson;
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id.toJSON(),
      clinicId: this.clinicId.toJSON(),
      patientId: this.patientId.toJSON(),
      createdByMemberId: this.createdByMemberId.toJSON(),
      responsibleProfessionalId: this.responsibleProfessionalId?.toJSON() ?? null,
      templateId: this.templateId.toJSON(),
      versionId: this.versionId.toJSON(),
      status: this.status,
      responseJson: this.responseJson,
      computedJson: this.computedJson,
      appliedAt: this.appliedAt.toJSON(),
      completedAt: this.completedAt?.toJSON() ?? null,
      createdAt: this.createdAt.toJSON(),
      updatedAt: this.updatedAt.toJSON(),
      deletedAt: this.deletedAt?.toJSON() ?? null,
    };
  }
}

export class PatientFormId extends EntityId<"PatientFormId"> {
  static from(value: string): PatientFormId {
    return new PatientFormId(value);
  }

  static generate(): PatientFormId {
    return new PatientFormId();
  }
}
