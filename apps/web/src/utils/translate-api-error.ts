import i18next from '@/translations/i18n';

/**
 * Translates a stable API error key when the backend provides one, preserving a
 * human-readable fallback for legacy endpoints that still return prose.
 */
export function translateApiError(detail: string | null | undefined, fallback: string): string {
    if (!detail) {
        return fallback;
    }

    return i18next.t(`errors.${detail}`, {defaultValue: detail});
}
