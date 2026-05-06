import type {Theme} from '../theme';
import type {RingAppearance, ShadowSize} from '.';
import {ring, shadow} from '.';

const theme = {
    colors: {
        ui: {
            style: {
                shadow: {
                    color: '#3F4856',
                    ring: {
                        dangerous: '#FC7282',
                        emphasized: '#8286FC',
                        offsetted: '#FFFFFF',
                    },
                },
            },
        },
    },
} as unknown as Theme;

describe('ring', () => {
    it.each<[RingAppearance, boolean, string]>([
        ['dangerous', true, '0 0 0 4px #FFFFFF,0 0 0 8px #FC7282'],
        ['dangerous', false, '0 0 0 4px #FC7282'],
        ['emphasized', true, '0 0 0 4px #FFFFFF,0 0 0 8px #8286FC'],
        ['emphasized', false, '0 0 0 4px #8286FC'],
    ])('should build a ring style with "%s" appearance and offsetted by', (appearance, offsetted, style) => {
        expect(ring(appearance, offsetted)(theme)).toStrictEqual(style);
    });

    it.each<[RingAppearance, boolean, string, string]>([
        ['dangerous', true, '1px', '0 0 0 calc(4px - 1px) #FFFFFF,0 0 0 8px #FC7282'],
        ['dangerous', false, '1px', '0 0 0 calc(4px - 1px) #FC7282'],
        ['emphasized', true, '1px', '0 0 0 calc(4px - 1px) #FFFFFF,0 0 0 8px #8286FC'],
        ['emphasized', false, '1px', '0 0 0 calc(4px - 1px) #8286FC'],
    ])('should build a ring style with "%s" discount', (appearance, offsetted, discount, style) => {
        expect(ring(appearance, offsetted, discount)(theme)).toStrictEqual(style);
    });
});

describe('shadow', () => {
    it.each<[ShadowSize, string]>([
        ['xs', '0px 1px 2px #3F48560D'],
        ['sm', '0px 1px 3px #3F48561A,0px 1px 2px #3F48560F'],
        ['md', '0px 4px 8px -2px #3F48561A,0px 2px 4px -2px #3F48560F'],
        ['lg', '0px 12px 16px -4px #3F485614,0px 4px 6px -2px #3F485608'],
        ['xl', '0px 20px 24px -4px #3F485614,0px 8px 8px -4px #3F485608'],
        ['2xl', '0px 24px 48px -12px #3F48562E'],
    ])('should build a shadow style with "%s" size', (size, style) => {
        expect(shadow(size)(theme)).toStrictEqual(style);
    });

    it.each<[ShadowSize, ShadowSize, string]>([
        ['xs', 'md', '0px 1px 2px #3F48560D,0px 4px 8px -2px #3F48561A,0px 2px 4px -2px #3F48560F'],
        [
            'sm',
            'md',
            [
                '0px 1px 3px #3F48561A',
                '0px 1px 2px #3F48560F',
                '0px 4px 8px -2px #3F48561A',
                '0px 2px 4px -2px #3F48560F',
            ].join(','),
        ],
        [
            'md',
            '2xl',
            ['0px 4px 8px -2px #3F48561A', '0px 2px 4px -2px #3F48560F', '0px 24px 48px -12px #3F48562E'].join(','),
        ],
        [
            'lg',
            'sm',
            [
                '0px 12px 16px -4px #3F485614',
                '0px 4px 6px -2px #3F485608',
                '0px 1px 3px #3F48561A',
                '0px 1px 2px #3F48560F',
            ].join(','),
        ],
        [
            'xl',
            'lg',
            [
                '0px 20px 24px -4px #3F485614',
                '0px 8px 8px -4px #3F485608',
                '0px 12px 16px -4px #3F485614',
                '0px 4px 6px -2px #3F485608',
            ].join(','),
        ],
        ['2xl', 'xs', ['0px 24px 48px -12px #3F48562E', '0px 1px 2px #3F48560D'].join(',')],
    ])('should build a shadow style with multiple sizes combined', (firstSize, secondSize, style) => {
        expect(shadow(firstSize, secondSize)(theme)).toStrictEqual(style);
    });

    it('should throw an error when an unknown size is provided', () => {
        expect(() => shadow('unknown' as ShadowSize)(theme)).toThrow('Unknown shadow size: unknown');
    });
});
