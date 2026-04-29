import { ZodIssueCode } from "zod";
import type { ExpectedIssue } from "../../../__tests__/zod.utils";
import { email } from "../index";

describe("An email schema", () => {
  it.each([
    "john.doe@ecxus.com.br",
    "vadimmoiseenkov@timspeak.ru",
    "gutamba@ghost-mailer.com",
    "uvstamm@domaain37.online",
  ])("should accept valid payloads", (payload) => {
    expect(email.safeParse(payload)).toEqual(
      expect.objectContaining({
        success: true,
      }),
    );
  });

  it.each<[string, ExpectedIssue]>([
    [
      "john",
      {
        code: ZodIssueCode.custom,
      },
    ],
    [
      "john.doe@.",
      {
        code: ZodIssueCode.custom,
      },
    ],
  ])("should reject invalid payloads", (payload, expected) => {
    const result = email.safeParse(payload);

    expect(result.success).toEqual(false);

    if (result.success) return;

    expect(result.error.errors).toEqual([
      expect.objectContaining({
        code: expected.code,
        path: [],
        message: "Invalid email format",
      }),
    ]);
  });
});
