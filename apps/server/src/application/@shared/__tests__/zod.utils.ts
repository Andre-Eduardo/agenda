import type { ZodIssueCode } from "zod";

export type ExpectedIssue = {
  code: ZodIssueCode;
  path?: Array<string | number>;
  keys?: string[];
  unionErrors?: {
    code: ZodIssueCode;
    path: string[];
  };
};
