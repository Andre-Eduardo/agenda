import { ZodIssueCode } from "zod";
import {
  RoomPermission,
  ReservationPermission,
  ProductPermission,
} from "../../../../../domain/auth";
import type { ExpectedIssue } from "../../../__tests__/zod.utils";
import { permission, permissions } from "../index";

describe("A permission schema", () => {
  it.each([RoomPermission.VIEW, "room:view", "product:delete", "room-category:delete"])(
    "should accept valid payloads",
    (payload) => {
      expect(permission.safeParse(payload)).toEqual(
        expect.objectContaining({
          success: true,
        }),
      );
    },
  );

  it.each<[string, ExpectedIssue]>([
    [
      "unknown:permission",
      {
        code: ZodIssueCode.custom,
      },
    ],
    [
      "foo",
      {
        code: ZodIssueCode.custom,
      },
    ],
  ])("should reject invalid payloads", (payload, expected) => {
    const result = permission.safeParse(payload);

    expect(result.success).toEqual(false);

    if (result.success) return;

    expect(result.error.errors).toEqual([
      expect.objectContaining({
        code: expected.code,
        path: [],
        message: "Invalid permission",
      }),
    ]);
  });
});

describe("A permissions schema", () => {
  it.each([
    [[RoomPermission.VIEW]],
    [[RoomPermission.DELETE, ReservationPermission.CANCEL]],
    [[ProductPermission.VIEW, "room-category:delete"]],
    [["room:view", "product:delete"]],
  ])("should accept valid payloads", (payload) => {
    expect(permissions.safeParse(payload)).toEqual(
      expect.objectContaining({
        success: true,
      }),
    );
  });

  it.each<[string[], ExpectedIssue]>([
    [
      ["unknown:permission"],
      {
        code: ZodIssueCode.custom,
        path: [0],
      },
    ],
    [
      ["bar", ReservationPermission.VIEW],
      {
        code: ZodIssueCode.custom,
        path: [0],
      },
    ],
    [
      [RoomPermission.VIEW, "foo"],
      {
        code: ZodIssueCode.custom,
        path: [1],
      },
    ],
  ])("should reject invalid payloads", (payload, expected) => {
    const result = permissions.safeParse(payload);

    expect(result.success).toEqual(false);

    if (result.success) return;

    expect(result.error.errors).toEqual([
      expect.objectContaining({
        code: expected.code,
        path: expected.path,
        message: "Invalid permission",
      }),
    ]);
  });
});
