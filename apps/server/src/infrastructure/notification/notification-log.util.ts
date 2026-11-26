/**
 * Masks a notification destination before it reaches a log line, so logs never carry the
 * patient's full phone number or e-mail (LGPD inventory, finding F-02).
 *
 * `5511987654321` → `55*******4321`, `maria.silva@example.com` → `ma***@example.com`.
 */
export function maskDestination(to: string): string {
    const at = to.indexOf('@');

    if (at > 0) {
        return `${to.slice(0, Math.min(2, at))}***${to.slice(at)}`;
    }

    if (to.length <= 6) {
        return '*'.repeat(to.length);
    }

    return `${to.slice(0, 2)}${'*'.repeat(to.length - 6)}${to.slice(-4)}`;
}

export function describeError(error: unknown): string {
    if (error instanceof Error) {
        return error.name === 'Error' ? error.message : `${error.name}: ${error.message}`;
    }

    return String(error);
}
