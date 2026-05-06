/**
 * Joins multiple ARIA ID references into a single space-separated string.
 * Filters out `null`, `undefined` and empty strings.
 *
 * Useful for `aria-labelledby` / `aria-describedby` that accept multiple IDs.
 *
 * @example
 * <input aria-labelledby={joinIds(labelId, descriptionId)} />
 */
export function joinIds(...ids: Array<string | undefined | null>): string | undefined {
    const nonEmptyIds = ids.filter((id) => id != null && id !== '');

    if (nonEmptyIds.length === 0) {
        return undefined;
    }

    return nonEmptyIds.join(' ');
}
