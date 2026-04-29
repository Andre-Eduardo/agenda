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
import {
  PatientAlertCreatedEvent,
  PatientAlertChangedEvent,
  PatientAlertDeletedEvent,
} from "@domain/patient-alert/events";

export enum AlertSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export type PatientAlertProps = EntityProps<PatientAlert>;
export type CreatePatientAlert = CreateEntity<PatientAlert>;
export type UpdatePatientAlert = Partial<PatientAlertProps>;

export class PatientAlert extends AggregateRoot<PatientAlertId> {
  clinicId: ClinicId;
  patientId: PatientId;
  /** Membro que criou o alerta (substitui professionalId). */
  createdByMemberId: ClinicMemberId;
  title: string;
  description: string | null;
  severity: AlertSeverity;
  isActive: boolean;

  constructor(props: AllEntityProps<PatientAlert>) {
    super(props);
    this.clinicId = props.clinicId;
    this.patientId = props.patientId;
    this.createdByMemberId = props.createdByMemberId;
    this.title = props.title;
    this.description = props.description ?? null;
    this.severity = props.severity;
    this.isActive = props.isActive ?? true;
  }

  static create(props: CreatePatientAlert): PatientAlert {
    const now = new Date();

    const alert = new PatientAlert({
      ...props,
      id: PatientAlertId.generate(),
      description: props.description ?? null,
      severity: props.severity ?? AlertSeverity.MEDIUM,
      isActive: props.isActive ?? true,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    alert.addEvent(new PatientAlertCreatedEvent({ alert, timestamp: now }));

    return alert;
  }

  change(props: UpdatePatientAlert): void {
    const oldState = new PatientAlert(this);

    if (props.title !== undefined) {
      this.title = props.title;
    }

    if (props.description !== undefined) {
      this.description = props.description;
    }

    if (props.severity !== undefined) {
      this.severity = props.severity;
    }

    if (props.isActive !== undefined) {
      this.isActive = props.isActive;
    }

    this.addEvent(new PatientAlertChangedEvent({ oldState, newState: this }));
  }

  delete(): void {
    this.addEvent(new PatientAlertDeletedEvent({ alert: this }));
  }

  toJSON(): EntityJson<PatientAlert> {
    return {
      id: this.id.toJSON(),
      clinicId: this.clinicId.toJSON(),
      patientId: this.patientId.toJSON(),
      createdByMemberId: this.createdByMemberId.toJSON(),
      title: this.title,
      description: this.description,
      severity: this.severity,
      isActive: this.isActive,
      createdAt: this.createdAt.toJSON(),
      updatedAt: this.updatedAt.toJSON(),
      deletedAt: this.deletedAt?.toJSON() ?? null,
    };
  }
}

export class PatientAlertId extends EntityId<"PatientAlertId"> {
  static from(value: string): PatientAlertId {
    return new PatientAlertId(value);
  }

  static generate(): PatientAlertId {
    return new PatientAlertId();
  }
}
