import type {DataTable} from '@cucumber/cucumber';
import type {JsonValue} from 'type-fest';
import type {Context} from './context';
import {parseValue} from './parser';

/**
 * Converts a data table to an object.
 *
 * @example
 * // Given the following table:
 * | Number       | 1     |
 * | Name         | A     |
 * | Status       | 200   |
 * | role.admin   | true  |
 *
 * // And the following header map:
 * const headerMap = {
 *    Number: 'number',
 *    Name: 'name',
 *    'Status code': 'statusCode',
 * };
 *
 * singleEntry(table);
 * // Returns:
 * {
 *   Number: 1,
 *   Name: 'A',
 *   Status: 200,
 *   role: { admin: true },
 * }
 *
 * @param context The scenario context.
 * @param table The data table to convert.
 * @param fieldMap A map of header names to property names.
 */
export function singleEntry<T extends Record<string, unknown>>(
    context: Context,
    table: DataTable,
    fieldMap: Record<string, string> = {}
): T {
    const entries: Array<[string, JsonValue]> = table.raw().map(([key, value]) => {
        const fieldKey = fieldMap[key];

        // If the key has more than one part, assume it's a nested object.
        if (!fieldKey && key.split('.').length > 1) {
            const [firstKey, ...nestedKeys] = key.split('.');

            return [firstKey, nestedKeys.reduceRight((acc, k) => ({[k]: acc}), parseValue(context, value))];
        }

        return [fieldKey ?? key, parseValue(context, value)];
    });

    // Convert the entries to an object and merge values with the same key.
    return entries.reduce(
        (acc, [key, value]) => {
            if (key in acc) {
                const accValue = acc[key];

                if (typeof value !== 'object' || typeof accValue !== 'object') {
                    return {[key]: value, ...acc};
                }

                return {...acc, [key]: {...accValue, ...value}};
            }

            return {[key]: value, ...acc};
        },
        {} as Record<string, JsonValue>
    ) as T;
}

/**
 * Converts a data table to an array of objects.
 *
 * The first row is used as the header, and the remaining rows are used as values.
 *
 * @example
 * // Given the following table:
 * | Number | Name | Status code |
 * | 1      | A    | 200         |
 * | 2      | B    | 300         |
 *
 * // And the following header map:
 * const headerMap = {
 *    Number: 'number',
 *    Name: 'name',
 *    'Status code': 'statusCode',
 * };
 *
 * convertTableToArray<RoomRow>(table, headerMap);
 * // Returns:
 * [
 *    { number: 1, name: 'A', statusCode: 200 },
 *    { number: 2, name: 'B', statusCode: 300 },
 * ]
 *
 * @param context The scenario context.
 * @param table The data table to convert.
 * @param fieldMap A map of header names to property names.
 */
export function multipleEntries<T extends Record<string, unknown>>(
    context: Context,
    table: DataTable,
    fieldMap: Record<string, string> = {}
): T[] {
    const rows = table.raw();

    const header = rows.splice(0, 1)[0].map((propertyName) => fieldMap[propertyName] ?? propertyName);

    return rows.map((row) =>
        row.reduce(
            (acc, value, index) => ({
                ...acc,
                [header[index]]: parseValue(context, value),
            }),
            {} as T
        )
    );
}
