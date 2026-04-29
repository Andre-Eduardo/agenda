import {
  AggregateRoot,
  type AllEntityProps,
  type CreateEntity,
  type EntityProps,
  type EntityJson,
} from "@domain/@shared/entity";
import { EntityId } from "@domain/@shared/entity/id";
import type { ClinicId } from "@domain/clinic/entities";
import type { ClinicMemberId } from "@domain/clinic-member/entities";
import { AiSpecialtyGroup } from "@domain/form-template/entities/ai-specialty-group";

export type FormTemplateProps = EntityProps<FormTemplate>;
export type CreateFormTemplate = CreateEntity<FormTemplate>;

export class FormTemplate extends AggregateRoot<FormTemplateId> {
  code: string;
  name: string;
  description: string | null;
  /** Grupo de IA para roteamento semântico de templates. Substituiu o enum Specialty obrigatório. */
  specialtyGroup: AiSpecialtyGroup | null;
  /** Rótulo livre de exibição para o usuário (ex: "Neuropsicologia", "Ortopedia Pediátrica"). */
  specialtyLabel: string | null;
  isPublic: boolean;
  /** Null para templates globais (isPublic=true). */
  clinicId: ClinicId | null;
  /** Membro que criou o template (null para templates globais). */
  createdByMemberId: ClinicMemberId | null;

  constructor(props: AllEntityProps<FormTemplate>) {
    super(props);
    this.code = props.code;
    this.name = props.name;
    this.description = props.description ?? null;
    this.specialtyGroup = props.specialtyGroup ?? null;
    this.specialtyLabel = props.specialtyLabel ?? null;
    this.isPublic = props.isPublic ?? false;
    this.clinicId = props.clinicId ?? null;
    this.createdByMemberId = props.createdByMemberId ?? null;
  }

  static create(props: CreateFormTemplate): FormTemplate {
    const now = new Date();

    return new FormTemplate({
      ...props,
      id: FormTemplateId.generate(),
      description: props.description ?? null,
      specialtyGroup: props.specialtyGroup ?? null,
      specialtyLabel: props.specialtyLabel ?? null,
      isPublic: props.isPublic ?? false,
      clinicId: props.clinicId ?? null,
      createdByMemberId: props.createdByMemberId ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  change(props: Partial<Pick<FormTemplateProps, "name" | "description">>): void {
    if (props.name !== undefined) this.name = props.name;

    if (props.description !== undefined) this.description = props.description;
    this.updatedAt = new Date();
  }

  softDelete(): void {
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  toJSON(): EntityJson<FormTemplate> {
    return {
      id: this.id.toJSON(),
      code: this.code,
      name: this.name,
      description: this.description,
      specialtyGroup: this.specialtyGroup,
      specialtyLabel: this.specialtyLabel,
      isPublic: this.isPublic,
      clinicId: this.clinicId?.toJSON() ?? null,
      createdByMemberId: this.createdByMemberId?.toJSON() ?? null,
      createdAt: this.createdAt.toJSON(),
      updatedAt: this.updatedAt.toJSON(),
      deletedAt: this.deletedAt?.toJSON() ?? null,
    };
  }
}

export class FormTemplateId extends EntityId<"FormTemplateId"> {
  static from(value: string): FormTemplateId {
    return new FormTemplateId(value);
  }

  static generate(): FormTemplateId {
    return new FormTemplateId();
  }
}
