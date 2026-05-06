export function joinIds(...ids: Array<string | undefined | null>): string | undefined {
    const nonEmptyIds = ids.filter((id) => id != null && id !== '');

    if (nonEmptyIds.length === 0) {
        return undefined;
    }

    return nonEmptyIds.join(' ');
}
