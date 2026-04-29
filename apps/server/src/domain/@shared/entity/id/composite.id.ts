import isEqualWith from "lodash.isequalwith";
import { isEquatable } from "@domain/@shared/equatable";
import { Identifier } from "@domain/@shared/entity/id/identifier.base";

export abstract class CompositeId<I1, I2> extends Identifier<"CompositeId"> {
  protected readonly ids: [I1, I2];

  protected constructor(id1: I1, id2: I2) {
    super();
    this.ids = [id1, id2];
  }

  equals(other: unknown): other is this {
    function equalityCustomizer(id1: unknown, id2: unknown): boolean | undefined {
      return isEquatable(id1) ? id1.equals(id2) : undefined;
    }

    return (
      other != null &&
      Object.is(Object.getPrototypeOf(this), Object.getPrototypeOf(other)) &&
      isEqualWith(this.ids[0], (other as CompositeId<I1, I2>).ids[0], equalityCustomizer) &&
      isEqualWith(this.ids[1], (other as CompositeId<I1, I2>).ids[1], equalityCustomizer)
    );
  }

  toString(): string {
    return this.ids.toString();
  }

  toJSON(): string {
    return this.toString();
  }
}
