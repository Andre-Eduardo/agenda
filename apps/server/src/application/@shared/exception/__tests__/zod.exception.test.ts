import { ZodError, ZodIssueCode } from "zod";
import { getViolations } from "../index";

describe("getViolations", () => {
  it("should return ZodError issues as input violations", () => {
    const error = new ZodError([
      {
        code: "custom",
        path: ["foo", "bar"],
        message: "Test message",
      },
    ]);

    expect(getViolations(error)).toEqual([
      {
        field: "foo.bar",
        reason: "Test message",
      },
    ]);
  });

  it("should return ZodError unrecognized_keys issues as input violations", () => {
    const error = new ZodError([
      {
        code: ZodIssueCode.unrecognized_keys,
        path: [],
        keys: ["foo", "bar", "baz"],
        message: "Test message",
      },
    ]);

    expect(getViolations(error)).toEqual([
      {
        field: "foo",
        reason: "Unrecognized key",
      },
      {
        field: "bar",
        reason: "Unrecognized key",
      },
      {
        field: "baz",
        reason: "Unrecognized key",
      },
    ]);
  });

  it("should return ZodError invalid_union issues as input violations", () => {
    const error = new ZodError([
      {
        code: ZodIssueCode.invalid_union,
        message: "Invalid input",
        path: [],
        unionErrors: [
          new ZodError([
            {
              code: ZodIssueCode.invalid_type,
              expected: "string",
              received: "number",
              path: ["id"],
              message: "Invalid input",
            },
          ]),
        ],
      },
    ]);

    expect(getViolations(error)).toEqual([
      {
        field: "id",
        reason: "Invalid input",
      },
    ]);
  });
});
