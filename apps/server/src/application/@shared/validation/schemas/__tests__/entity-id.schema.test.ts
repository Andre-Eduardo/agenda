import { EntityId } from "../../../../../domain/@shared/entity/id";
import { entityId } from "../index";

class TestId extends EntityId<"test"> {
  static from(value: string): TestId {
    return new TestId(value);
  }
}

describe("An entity ID schema", () => {
  it("should validate a parsable ID", () => {
    const value = "800213b5-29a8-4c92-86cf-1b890e758279";

    jest.spyOn(TestId, "from");

    const schema = entityId(TestId);

    expect(() => schema.parse(value)).not.toThrow();
    expect(TestId.from).toHaveBeenCalledWith(value);
  });

  it("should throw an error if the ID is malformed", () => {
    const value = "invalid-id";

    jest.spyOn(TestId, "from");

    const schema = entityId(TestId);

    expect(() => schema.parse(value)).toThrow();
    expect(TestId.from).toHaveBeenCalledWith(value);
  });
});
