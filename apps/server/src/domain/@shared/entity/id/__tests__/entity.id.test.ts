import { UUID } from "uuidv7";
import { EntityId } from "../index";

class TestId extends EntityId<"Test"> {
  public constructor(value?: string) {
    super(value);
  }
}

describe("EntityId", () => {
  it("should generate a new ID when no value is provided", () => {
    const id = new TestId();

    expect(() => UUID.parse(id.toString())).not.toThrow();
  });

  it("should use the provided ID", () => {
    const uuid = "3243603b-4aae-4504-b7ad-3bc3d2c52b1c";
    const id = new TestId(uuid);

    expect(id.toString()).toBe(uuid);
  });

  it("should throw an error when an invalid ID is provided", () => {
    expect(() => new TestId("invalid")).toThrowWithMessage(
      SyntaxError,
      "The identifier must be a valid UUID.",
    );
  });

  it("should compare two IDs", () => {
    const id1 = new TestId();
    const id2 = new TestId(id1.toString());
    const id3 = new TestId();

    expect(id1.equals(id2)).toBeTrue();
    expect(id1.equals(id3)).toBeFalse();
  });

  it("can be serializable to JSON", () => {
    const uuid = "3243603b-4aae-4504-b7ad-3bc3d2c52b1c";
    const id = new TestId(uuid);

    expect(id.toJSON()).toBe(uuid);
  });
});
