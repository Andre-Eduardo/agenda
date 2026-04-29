import { ZodIssueCode } from "zod";
import { Username } from "../../../../../domain/user/value-objects";
import type { ExpectedIssue } from "../../../__tests__/zod.utils";
import { username } from "../index";

describe("A username schema", () => {
  it.each(["john.doe", "foo1bar", "john_doe123", "__johndoe__"])(
    "should accept valid payloads",
    (payload) => {
      expect(username.safeParse(payload)).toEqual(
        expect.objectContaining({
          success: true,
        }),
      );
    },
  );

  it.each<[string, ExpectedIssue]>([
    [
      "john..doe",
      {
        code: ZodIssueCode.custom,
      },
    ],
    [
      "john.doe!",
      {
        code: ZodIssueCode.custom,
      },
    ],
    [
      "john.doeeeeeeeeeeeeeeeeeeeeeeee",
      {
        code: ZodIssueCode.custom,
      },
    ],
  ])("should reject invalid payloads", (payload, expected) => {
    const result = username.safeParse(payload);

    expect(result.success).toEqual(false);

    if (result.success) return;

    expect(result.error.errors).toEqual([
      expect.objectContaining({
        code: expected.code,
        path: [],
        message:
          "The username must be between 1 and 30 characters long and can only contain letters, numbers, hyphens, underscores, and periods.",
      }),
    ]);
  });

  it("should reject when failing to parse", () => {
    jest.spyOn(Username, "create").mockImplementationOnce(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- For testing purposes
      throw "Unknown error";
    });

    const result = username.safeParse("john.doe");

    expect(result.success).toEqual(false);

    if (result.success) return;

    expect(result.error.errors).toEqual([
      expect.objectContaining({
        code: ZodIssueCode.custom,
        path: [],
        message: "Invalid username format",
      }),
    ]);
  });
});
