import {
  type AllEntityProps,
  type EntityProps,
  type CreateEntity,
  Entity,
} from "@domain/@shared/entity";
import { EntityId } from "@domain/@shared/entity/id";
import type { ClinicId } from "@domain/clinic/entities";
import type { ClinicMemberId } from "@domain/clinic-member/entities";

export type MemberBlockProps = EntityProps<MemberBlock>;
export type CreateMemberBlock = CreateEntity<MemberBlock>;

/**
 * Bloqueio de agenda de um membro da clínica.
 * Substituiu ProfessionalBlock — agora referencia ClinicMember.
 */
export class MemberBlock extends Entity<MemberBlockId> {
  /** Desnormalizado para isolamento de tenant (Bloco 6). */
  clinicId: ClinicId;
  clinicMemberId: ClinicMemberId;
  startAt: Date;
  endAt: Date;
  reason: string | null;

  constructor(props: AllEntityProps<MemberBlock>) {
    super(props);
    this.clinicId = props.clinicId;
    this.clinicMemberId = props.clinicMemberId;
    this.startAt = props.startAt;
    this.endAt = props.endAt;
    this.reason = props.reason ?? null;
  }

  static create(props: CreateMemberBlock): MemberBlock {
    const now = new Date();

    return new MemberBlock({
      ...props,
      id: MemberBlockId.generate(),
      reason: props.reason ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  softDelete(): void {
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id.toJSON(),
      clinicId: this.clinicId.toJSON(),
      clinicMemberId: this.clinicMemberId.toJSON(),
      startAt: this.startAt.toJSON(),
      endAt: this.endAt.toJSON(),
      reason: this.reason,
      createdAt: this.createdAt.toJSON(),
      updatedAt: this.updatedAt.toJSON(),
      deletedAt: this.deletedAt?.toJSON() ?? null,
    };
  }

  overlaps(startAt: Date, endAt: Date): boolean {
    return this.startAt < endAt && this.endAt > startAt;
  }
}

export class MemberBlockId extends EntityId<"MemberBlockId"> {
  static from(value: string): MemberBlockId {
    return new MemberBlockId(value);
  }

  static generate(): MemberBlockId {
    return new MemberBlockId();
  }
}
