import {InvalidInputException} from '../exceptions';

/**
 * Tipo utilitário que representa o shape de um enum TypeScript (ex: `enum Foo { A = 'A' }`)
 * ou um objeto `Record<string, string>` com os mesmos valores runtime (Prisma gera enums
 * como string literal unions, mas o valor runtime é equivalente).
 */
export type EnumLike<TValue extends string = string> = Record<string, TValue>;

/**
 * Valida em runtime que `value` é um membro válido de `enumType` e retorna o valor
 * já com o tipo correto do enum. Use para fazer conversões type-safe entre Prisma
 * enums (string literal unions) e enums de domínio que compartilham os mesmos valores,
 * eliminando a necessidade de `as unknown as EnumType`.
 *
 * @throws {InvalidInputException} se o valor não pertencer ao enum.
 */
export function toEnum<T extends EnumLike>(enumType: T, value: string): T[keyof T] {
    const validValues = Object.values(enumType) as string[];

    if (!validValues.includes(value)) {
        throw new InvalidInputException(
            `Invalid enum value "${value}". Expected one of: ${validValues.join(', ')}.`,
        );
    }

    return value as T[keyof T];
}

/**
 * Variante que aceita valores nuláveis. Retorna `null` quando `value` é null/undefined,
 * caso contrário valida e converte via {@link toEnum}.
 */
export function toEnumOrNull<T extends EnumLike>(
    enumType: T,
    value: string | null | undefined,
): T[keyof T] | null {
    if (value == null) return null;

    return toEnum(enumType, value);
}

/**
 * Variante para arrays: valida cada item e retorna o array tipado.
 */
export function toEnumArray<T extends EnumLike>(enumType: T, values: readonly string[]): Array<T[keyof T]> {
    return values.map((v) => toEnum(enumType, v));
}
