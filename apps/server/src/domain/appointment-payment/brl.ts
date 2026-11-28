// eslint-disable-next-line no-restricted-imports -- Implement decimal BRL arithmetic in one place.
import BigNumber from 'bignumber.js';

export function brl(value: number): BigNumber {
    return new BigNumber(value).decimalPlaces(2);
}

export function brlFromCents(cents: number): number {
    return new BigNumber(cents).shiftedBy(-2).toNumber();
}

/** Converte reais em centavos inteiros, arredondando na segunda casa. */
export function centsFromBrl(value: number): number {
    return new BigNumber(value).shiftedBy(2).integerValue(BigNumber.ROUND_HALF_UP).toNumber();
}
