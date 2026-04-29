import type { ZodType } from "zod";
import { z, ZodIssueCode } from "zod";
import type { ExpectedIssue } from "../../../__tests__/zod.utils";
import { datetime } from "../datetime.schema";
import { rangeFilter } from "../range-filter.schema";

describe("A datetime schema", () => {
  it.each([
    {
      payload: {
        from: "2024-01-01T00:00:00.000Z",
        to: "2024-01-25T00:00:00.000Z",
      },
      type: datetime,
    },
    {
      payload: {
        from: new Date(1000).toISOString(),
        to: new Date(2000).toISOString(),
      },
      type: datetime,
    },
    {
      payload: {
        from: 1,
        to: 2,
      },
      type: z.number(),
    },
  ])("should accept valid payloads", ({ payload, type }) => {
    expect(rangeFilter(type).safeParse(payload)).toEqual(
      expect.objectContaining({
        success: true,
      }),
    );
  });

  it.each<[{ payload: Record<string, unknown>; type: ZodType }, ExpectedIssue]>([
    [
      {
        payload: {
          from: "2024-01-02T00:00:00.100Z",
          to: "2024-01-02T00:00:00.099Z",
        },
        type: datetime,
      },
      {
        code: ZodIssueCode.custom,
        path: [],
      },
    ],
    [
      {
        payload: {
          from: new Date(123).toISOString(),
          to: 1,
        },
        type: datetime,
      },
      {
        code: ZodIssueCode.invalid_type,
        path: ["to"],
      },
    ],
    [
      {
        payload: {
          from: new Date(123),
          to: 123,
        },
        type: z.number(),
      },
      {
        code: ZodIssueCode.invalid_type,
        path: ["from"],
      },
    ],
    [
      {
        payload: {
          from: 2,
          to: 1,
        },
        type: z.number(),
      },
      {
        code: ZodIssueCode.custom,
        path: [],
      },
    ],
  ])("should reject invalid payloads", ({ payload, type }, expected) => {
    const result = rangeFilter(type).safeParse(payload);

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
