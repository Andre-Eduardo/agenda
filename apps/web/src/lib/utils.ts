import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}

const brlFormatter = new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'});
const usdFormatter = new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'USD'});

export function formatBRL(value: number): string {
    return brlFormatter.format(value);
}

export function formatUSD(value: number): string {
    return usdFormatter.format(value);
}
