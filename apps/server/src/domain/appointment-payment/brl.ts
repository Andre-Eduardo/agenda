// eslint-disable-next-line no-restricted-imports -- Implement decimal BRL arithmetic in one place.
import BigNumber from 'bignumber.js';

export function brl(value: number): BigNumber {
    return new BigNumber(value).decimalPlaces(2);
}

export function brlFromCents(cents: number): number {
    return new BigNumber(cents).shiftedBy(-2).toNumber();
}
