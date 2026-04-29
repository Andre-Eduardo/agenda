import {
  AggregateRoot,
  type AllEntityProps,
  type EntityJson,
  type EntityProps,
  type CreateEntity,
} from "@domain/@shared/entity";
import { EntityId } from "@domain/@shared/entity/id";
import type { PatientId } from "@domain/patient/entities";
import type { ClinicId } from "@domain/clinic/entities";
import type { ClinicMemberId } from "@domain/clinic-member/entities";

export enum ContextSnapshotStatus {
  PENDING = "PENDING",
  READY = "READY",
  /** Snapshot desatualizado — novos records/formulários foram criados depois */
  STALE = "STALE",
  FAILED = "FAILED",
}

/**
 * Facts estruturados do paciente.
 * Separação intencional de dados estruturados vs. texto livre para otimização de tokens.
 */
export type PatientFacts = {
  name: string | null;
  birthDate: string | null;
  age: number | null;
  gender: string | null;
  documentId: string;
  allergies: string | null;
  chronicConditions: string | null;
  currentMedications: string | null;
  surgicalHistory: string | null;
  familyHistory: string | null;
  socialHistory: string | null;
  generalNotes: string | null;
};

export type CriticalContextEntry = {
  type: "ALERT" | "ALLERGY" | "CONTRAINDICATION";
  severity: string;
  title: string;
  description: string | null;
};

export type TimelineEntry = {
  date: string;
  type: string;
  title: string | null;
  summary: string | null;
  sourceId: string;
  sourceType: string;
};

export type ContextSnapshotProps = EntityProps<PatientContextSnapshot>;
export type CreateContextSnapshot = CreateEntity<PatientContextSnapshot>;

export class PatientContextSnapshot extends AggregateRoot<PatientContextSnapshotId> {
  clinicId: ClinicId;
  patientId: PatientId;
  /** null = snapshot genérico; preenchido = snapshot com perspectiva de um membro */
  memberId: ClinicMemberId | null;
  /** Facts estruturados do paciente — base para construção de contexto de IA */
  patientFacts: PatientFacts;
  /** Alertas e informações críticas que devem sempre aparecer no contexto */
  criticalContext: CriticalContextEntry[] | null;
  /** Timeline resumida de eventos clínicos relevantes */
  timelineSummary: TimelineEntry[] | null;
  /** Hash do conjunto de dados usado — detecta staleness */
  contentHash: string;
  status: ContextSnapshotStatus;
  builtAt: Date | null;

  constructor(props: AllEntityProps<PatientContextSnapshot>) {
    super(props);
    this.clinicId = props.clinicId;
    this.patientId = props.patientId;
    this.memberId = props.memberId ?? null;
    this.patientFacts = props.patientFacts;
    this.criticalContext = props.criticalContext ?? null;
    this.timelineSummary = props.timelineSummary ?? null;
    this.contentHash = props.contentHash;
    this.status = props.status ?? ContextSnapshotStatus.PENDING;
    this.builtAt = props.builtAt ?? null;
  }

  static create(props: CreateContextSnapshot): PatientContextSnapshot {
    const now = new Date();

    return new PatientContextSnapshot({
      ...props,
      id: PatientContextSnapshotId.generate(),
      clinicId: props.clinicId,
      patientId: props.patientId,
      memberId: props.memberId ?? null,
      patientFacts: props.patientFacts,
      criticalContext: props.criticalContext ?? null,
      timelineSummary: props.timelineSummary ?? null,
      contentHash: props.contentHash,
      status: ContextSnapshotStatus.PENDING,
      builtAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  markReady(): void {
    this.status = ContextSnapshotStatus.READY;
    this.builtAt = new Date();
    this.update();
  }

  markStale(): void {
    this.status = ContextSnapshotStatus.STALE;
    this.update();
  }

  markFailed(): void {
    this.status = ContextSnapshotStatus.FAILED;
    this.update();
  }

  toJSON(): EntityJson<PatientContextSnapshot> {
    return {
      id: this.id.toJSON(),
      clinicId: this.clinicId.toJSON(),
      patientId: this.patientId.toJSON(),
      memberId: this.memberId?.toJSON() ?? null,
      patientFacts: this.patientFacts,
      criticalContext: this.criticalContext,
      timelineSummary: this.timelineSummary,
      contentHash: this.contentHash,
      status: this.status,
      builtAt: this.builtAt?.toJSON() ?? null,
      createdAt: this.createdAt.toJSON(),
      updatedAt: this.updatedAt.toJSON(),
      deletedAt: null,
    };
  }
}

export class PatientContextSnapshotId extends EntityId<"PatientContextSnapshotId"> {
  static from(value: string): PatientContextSnapshotId {
    return new PatientContextSnapshotId(value);
  }

  static generate(): PatientContextSnapshotId {
    return new PatientContextSnapshotId();
  }
}
