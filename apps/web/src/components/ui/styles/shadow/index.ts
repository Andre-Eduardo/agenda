import type {Theme} from '../theme';
import type {SemanticColors} from '../theme/colors';

export type RingAppearance = Extract<SemanticColors, 'emphasized' | 'dangerous' | 'neutral'>;

export function ring(appearance: RingAppearance, offsetted?: boolean, discount?: string): (theme: Theme) => string {
    const width = discount === undefined ? '4px' : `calc(4px - ${discount})`;

    if (offsetted) {
        return ({colors}: Theme): string =>
            [
                `0 0 0 ${width} ${colors.ui.style.shadow.ring.offsetted}`,
                `0 0 0 8px ${colors.ui.style.shadow.ring[appearance]}`,
            ].toString();
    }

    return ({colors}: Theme): string => `0 0 0 ${width} ${colors.ui.style.shadow.ring[appearance]}`;
}

export type ShadowSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export function shadow(size: ShadowSize, ...sizes: ShadowSize[]): (theme: Theme) => string {
    if (sizes.length > 0) {
        return (theme): string => [size, ...sizes].map((current) => shadow(current)(theme)).toString();
    }

    switch (size) {
        case 'xs':
            return ({colors}): string => `0px 1px 2px ${colors.ui.style.shadow.color}0D`;

        case 'sm':
            return ({colors}): string =>
                `${[`0px 1px 3px ${colors.ui.style.shadow.color}1A`, `0px 1px 2px ${colors.ui.style.shadow.color}0F`]}`;

        case 'md':
            return ({colors}): string =>
                `${[
                    `0px 4px 8px -2px ${colors.ui.style.shadow.color}1A`,
                    `0px 2px 4px -2px ${colors.ui.style.shadow.color}0F`,
                ]}`;

        case 'lg':
            return ({colors}): string =>
                `${[
                    `0px 12px 16px -4px ${colors.ui.style.shadow.color}14`,
                    `0px 4px 6px -2px ${colors.ui.style.shadow.color}08`,
                ]}`;

        case 'xl':
            return ({colors}): string =>
                `${[
                    `0px 20px 24px -4px ${colors.ui.style.shadow.color}14`,
                    `0px 8px 8px -4px ${colors.ui.style.shadow.color}08`,
                ]}`;

        case '2xl':
            return ({colors}): string => `0px 24px 48px -12px ${colors.ui.style.shadow.color}2E`;

        default:
            throw new Error(`Unknown shadow size: ${size}`);
    }
}
