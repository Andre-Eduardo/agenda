import { ZodIssueCode } from "zod";
import type { ExpectedIssue } from "../../../__tests__/zod.utils";
import { pagination } from "../index";

describe("A pagination schema", () => {
  it.each([
    {
      sortOptions: ["id", "name"],
      payload: {
        limit: 100,
      },
    },
    {
      sortOptions: ["id", "name"],
      payload: {
        limit: "100",
      },
    },
    {
      sortOptions: ["id", "name"],
      payload: {
        cursor: "cursor",
        limit: 1,
      },
    },
    {
      sortOptions: ["id", "name"],
      payload: {
        limit: 10,
        sort: {
          id: "asc",
          name: "desc",
        },
      },
    },
  ])("should accept valid payloads", ({ sortOptions, payload }) => {
    expect(pagination(sortOptions as [string, ...string[]]).safeParse(payload)).toEqual(
      expect.objectContaining({
        success: true,
      }),
    );
  });

  it.each<[Record<string, unknown>, ExpectedIssue]>([
    [
      {
        sortOptions: ["id", "name"],
        payload: {
          limit: "1A",
        },
      },
      {
        code: ZodIssueCode.invalid_type,
        path: ["limit"],
      },
    ],
    [
      {
        sortOptions: ["id", "name"],
        payload: {
          limit: -1,
        },
      },
      {
        code: ZodIssueCode.too_small,
        path: ["limit"],
      },
    ],
    [
      {
        sortOptions: ["id", "name"],
        payload: {
          limit: 10,
          cursor: 1,
        },
      },
      {
        code: ZodIssueCode.invalid_type,
        path: ["cursor"],
      },
    ],
    [
      {
        sortOptions: ["id", "name"],
        payload: {
          limit: 10,
          sort: {
            id: "foo",
          },
        },
      },
      {
        code: ZodIssueCode.invalid_enum_value,
        path: ["sort", "id"],
      },
    ],
  ])("should reject invalid payloads", ({ sortOptions, payload }, expected) => {
    const result = pagination(sortOptions as [string, ...string[]]).safeParse(payload);

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
