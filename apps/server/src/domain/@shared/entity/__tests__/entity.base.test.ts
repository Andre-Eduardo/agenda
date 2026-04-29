import { Identifier } from "../id/identifier.base";
import type { EntityJson } from "../index";
import { Entity } from "../index";

class TestId extends Identifier<"test"> {}

class TestEntity extends Entity<TestId> {
  public constructor(props: { id: TestId; createdAt: Date; updatedAt: Date }) {
    super(props);
  }

  public update(): void {
    super.update();
  }

  toJSON(): EntityJson<TestEntity> {
    return {
      id: "test",
      createdAt: this.createdAt.toJSON(),
      updatedAt: this.updatedAt.toJSON(),
    };
  }
}

describe("A base entity", () => {
  describe("when created", () => {
    it("should have an id", () => {
      const id = new TestId();

      const entity = new TestEntity({
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(entity.id).toBe(id);
    });

    it("should have a createdAt and updatedAt date", () => {
      jest.useFakeTimers({ now: new Date("2024-01-01T00:00:00Z") });

      const now = new Date();

      const entity = new TestEntity({
        id: new TestId(),
        createdAt: now,
        updatedAt: now,
      });

      expect(entity.createdAt).toEqual(now);
      expect(entity.updatedAt).toEqual(now);

      jest.useRealTimers();
    });
  });

  describe("when updated", () => {
    it("should update the updatedAt date", () => {
      jest.useFakeTimers({ now: new Date("2024-01-01T00:00:00Z") });

      const now = new Date();

      const entity = new TestEntity({
        id: new TestId(),
        createdAt: now,
        updatedAt: now,
      });

      expect(entity.updatedAt).toEqual(now);

      jest.advanceTimersByTime(1000);

      entity.update();

      expect(entity.updatedAt).toEqual(new Date("2024-01-01T00:00:01Z"));

      jest.useRealTimers();
    });
  });
});
