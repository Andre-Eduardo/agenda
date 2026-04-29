import {
  AggregateRoot,
  type AllEntityProps,
  type CreateEntity,
  type EntityJson,
  type EntityProps,
} from "@domain/@shared/entity";
import { EntityId } from "@domain/@shared/entity/id";
import type { ClinicMemberId } from "@domain/clinic-member/entities";
import type { AiSpecialtyGroup } from "@domain/form-template/entities";
import {
  ProfessionalCreatedEvent,
  ProfessionalChangedEvent,
  ProfessionalDeletedEvent,
} from "@domain/professional/events";

export type ProfessionalProps = EntityProps<Professional>;
export type CreateProfessional = CreateEntity<Professional>;
export type UpdateProfessional = Partial<ProfessionalProps>;

/**
 * Profissional de saúde — extensão 1:1 de ClinicMember (apenas role=PROFESSIONAL).
 *
 * MUDANÇAS:
 * - Não extende mais Person (dados pessoais ficam em User via ClinicMember)
 * - Não tem mais relação direta com User (vai via ClinicMember)
 * - Não tem mais ProfessionalConfig (color migrou para ClinicMember)
 * - Aparece nas relações de "responsabilidade clínica" (responsibleProfessionalId)
 * - specialtyNormalized migrou de Specialty → AiSpecialtyGroup (Bloco 1)
 */
export class Professional extends AggregateRoot<ProfessionalId> {
  clinicMemberId: ClinicMemberId;
  registrationNumber: string | null;
  /** Campo livre — "Neuropsicologia", "Ortopedia Pediátrica", etc. */
  specialty: string | null;
  /** Grupo de IA derivado do campo `specialty`. Usado para roteamento do agente. */
  specialtyNormalized: AiSpecialtyGroup | null;

  constructor(props: AllEntityProps<Professional>) {
    super(props);
    this.clinicMemberId = props.clinicMemberId;
    this.registrationNumber = props.registrationNumber ?? null;
    this.specialty = props.specialty ?? null;
    this.specialtyNormalized = props.specialtyNormalized ?? null;
  }

  static create(props: CreateProfessional): Professional {
    const now = new Date();

    const professional = new Professional({
      ...props,
      id: ProfessionalId.generate(),
      clinicMemberId: props.clinicMemberId,
      registrationNumber: props.registrationNumber ?? null,
      specialty: props.specialty ?? null,
      specialtyNormalized: props.specialtyNormalized ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    professional.addEvent(new ProfessionalCreatedEvent({ professional, timestamp: now }));

    return professional;
  }

  delete(): void {
    super.delete();
    this.addEvent(new ProfessionalDeletedEvent({ professional: this }));
  }

  change(props: UpdateProfessional): void {
    const oldState = new Professional(this);

    if (props.registrationNumber !== undefined) {
      this.registrationNumber = props.registrationNumber;
    }

    if (props.specialty !== undefined) {
      this.specialty = props.specialty;
    }

    if (props.specialtyNormalized !== undefined) {
      this.specialtyNormalized = props.specialtyNormalized;
    }

    this.addEvent(new ProfessionalChangedEvent({ oldState, newState: this }));
  }

  toJSON(): EntityJson<Professional> {
    return {
      id: this.id.toJSON(),
      clinicMemberId: this.clinicMemberId.toJSON(),
      registrationNumber: this.registrationNumber,
      specialty: this.specialty,
      specialtyNormalized: this.specialtyNormalized,
      createdAt: this.createdAt.toJSON(),
      updatedAt: this.updatedAt.toJSON(),
      deletedAt: this.deletedAt?.toJSON() ?? null,
    };
  }
}

export class ProfessionalId extends EntityId<"ProfessionalId"> {
  static from(value: string): ProfessionalId {
    return new ProfessionalId(value);
  }

  static generate(): ProfessionalId {
    return new ProfessionalId();
  }
}
