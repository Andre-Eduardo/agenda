import { ZodIssueCode } from "zod";
import type { ExpectedIssue } from "../../../__tests__/zod.utils";
import { documentId } from "../document-id.schema";

describe("A document ID schema", () => {
  it.each(["123.456.789-01", "12345678901", "123456789-01"])(
    "should accept valid payloads",
    (payload) => {
      expect(documentId.safeParse(payload)).toEqual(
        expect.objectContaining({
          success: true,
        }),
      );
    },
  );

  it.each<[string, ExpectedIssue]>([
    [
      "12222a",
      {
        code: ZodIssueCode.custom,
      },
    ],
    [
      "12222-.",
      {
        code: ZodIssueCode.custom,
      },
    ],
  ])("should reject invalid payloads", (payload, expected) => {
    const result = documentId.safeParse(payload);

    expect(result.success).toEqual(false);

    if (result.success) return;

    expect(result.error.errors).toEqual([
      expect.objectContaining({
        code: expected.code,
        path: [],
        message: "Invalid document ID",
      }),
    ]);
  });
});
