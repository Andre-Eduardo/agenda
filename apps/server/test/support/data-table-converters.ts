import type { DataTable } from "@cucumber/cucumber";
import type { Context } from "./context";
import { parseValue } from "./parser";

/**
 * Converts a vertical DataTable (two-column key→value) into a plain object.
 *
 * Example table:
 *   | name     | John Doe        |
 *   | username | john_doe        |
 *   | password | S3cr3t@pwd      |
 *
 * An optional fieldMap can rename keys:
 *   fieldMap = { 'User Name': 'username' }
 */
export function singleEntry<T extends Record<string, unknown>>(
  context: Context,
  table: DataTable,
  fieldMap: Record<string, string> = {},
): T {
  const entries: Array<[string, unknown]> = table.raw().map(([rawKey, rawValue]) => {
    const key = fieldMap[rawKey] ?? rawKey;
    const value = parseValue(context, rawValue);

    // Support dot-notation keys to build nested objects: "auth.token" → {auth: {token: value}}
    const parts = key.split(".");

    if (parts.length > 1) {
      const rootKey = parts[0];
      const nested = parts.slice(1).reduceRight<unknown>((acc, k) => ({ [k]: acc }), value);

      return [rootKey, nested];
    }

    return [key, value];
  });

  return entries.reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (key in acc) {
      const existing = acc[key];

      if (
        typeof existing === "object" &&
        existing !== null &&
        typeof value === "object" &&
        value !== null
      ) {
        return { ...acc, [key]: { ...existing, ...value } };
      }
    }

    return { ...acc, [key]: value };
  }, {}) as T;
}

/**
 * Converts a horizontal DataTable (first row = headers, remaining rows = data)
 * into an array of plain objects.
 *
 * Example table:
 *   | Name     | Username | Password   |
 *   | John Doe | john_doe | S3cr3t@pwd |
 *   | Jane Doe | jane_doe | P@ssw0rd   |
 *
 * An optional fieldMap can rename header keys:
 *   fieldMap = { 'Name': 'name', 'Username': 'username' }
 */
export function multipleEntries<T extends Record<string, unknown>>(
  context: Context,
  table: DataTable,
  fieldMap: Record<string, string> = {},
): T[] {
  const rows = table.raw();
  const headers = rows[0].map((h) => fieldMap[h] ?? h);
  const dataRows = rows.slice(1);

  return dataRows.map(
    (row) =>
      row.reduce<Record<string, unknown>>((acc, rawValue, idx) => {
        acc[headers[idx]] = parseValue(context, rawValue);

        return acc;
      }, {}) as T,
  );
}
