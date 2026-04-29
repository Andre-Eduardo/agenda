import { ZodIssueCode } from "zod";
import { UserId } from "../../../../domain/user/entities";
import type { ExpectedIssue } from "../../../@shared/__tests__/zod.utils";
import { GetUserDto } from "../index";

describe("A GetUserDto", () => {
  it.each([
    {
      id: UserId.generate().toString(),
    },
  ])("should accept valid payloads", (payload) => {
    expect(GetUserDto.schema.safeParse(payload)).toEqual(
      expect.objectContaining({
        success: true,
      }),
    );
  });

  it.each<[Record<string, unknown>, ExpectedIssue]>([
    [
      {
        id: 1,
      },
      {
        code: ZodIssueCode.invalid_type,
        path: ["id"],
      },
    ],
    [
      {
        id: "foo",
      },
      {
        code: ZodIssueCode.custom,
        path: ["id"],
      },
    ],
  ])("should reject invalid payloads", (payload, expected) => {
    const result = GetUserDto.schema.safeParse(payload);

    expect(result.success).toEqual(false);

    if (result.success) return;

    expect(result.error.errors).toEqual([
      expect.objectContaining({
        code: expected.code,
        path: expected.path,
        ...(expected.keys && { keys: expected.keys }),
      }),
    ]);
  });
});
