import type { EntityJson } from "@domain/@shared/entity/entity.types";
import type { Identifier } from "@domain/@shared/entity/id/identifier.base";

type EntityProps<I extends Identifier<string>> = {
  id: I;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null | undefined;
};

export abstract class Entity<I extends Identifier<string>> {
  readonly id: I;

  readonly createdAt: Date;

  updatedAt: Date;

  deletedAt: Date | null;

  protected constructor(props: EntityProps<I>) {
    this.id = props.id;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.deletedAt = props.deletedAt ?? null;
  }

  public isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  protected update(date?: Date): void {
    this.updatedAt = date ?? new Date();
  }

  protected delete(date?: Date): void {
    this.deletedAt = date ?? new Date();
  }

  abstract toJSON(): EntityJson<Entity<I>>;
}
