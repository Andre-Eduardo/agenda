/** DDD + número, 10 ou 11 dígitos (o DDI 55 é acrescentado pelo servidor). */
export function isValidPhone(value: string): boolean {
    const digits = value.replaceAll(/\D/g, '');

    return digits.length === 10 || digits.length === 11;
}

export function formatPhone(phone: string | null): string {
    if (!phone) return '—';

    const digits = phone.replaceAll(/\D/g, '');
    const local = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits;

    if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;

    if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;

    return phone;
}
