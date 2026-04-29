import { ZodIssueCode } from "zod";
import { ObfuscatedPassword } from "../../../../../domain/user/value-objects";
import type { ExpectedIssue } from "../../../__tests__/zod.utils";
import { password } from "../index";

describe("A password schema", () => {
  it.each(["Pa$$w0rd", "4BIG_password_here_with_symbol_and_number_1!"])(
    "should accept valid payloads",
    (payload) => {
      expect(password.safeParse(payload)).toEqual(
        expect.objectContaining({
          success: true,
        }),
      );
    },
  );

  it.each<[string, ExpectedIssue]>([
    [
      "Pa1!",
      {
        code: ZodIssueCode.custom,
      },
    ],
    [
      "password",
      {
        code: ZodIssueCode.custom,
      },
    ],
    [
      "pa$sword1",
      {
        code: ZodIssueCode.custom,
      },
    ],
  ])("should reject invalid payloads", (payload, expected) => {
    const result = password.safeParse(payload);

    expect(result.success).toEqual(false);

    if (result.success) return;

    expect(result.error.errors).toEqual([
      expect.objectContaining({
        code: expected.code,
        path: [],
        message:
          "The password must be " +
          "at least 8 characters long " +
          "and contain at least one lowercase letter, " +
          "one uppercase letter, " +
          "one number, " +
          "and one special character.",
      }),
    ]);
  });

  it("should reject when failing to parse", () => {
    jest.spyOn(ObfuscatedPassword, "validate").mockImplementationOnce(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- For testing purposes
      throw "Unknown error";
    });

    const result = password.safeParse("Pa$$w0rd");

    expect(result.success).toEqual(false);

    if (result.success) return;

    expect(result.error.errors).toEqual([
      expect.objectContaining({
        code: ZodIssueCode.custom,
        path: [],
        message: "Invalid password format",
      }),
    ]);
  });
});
