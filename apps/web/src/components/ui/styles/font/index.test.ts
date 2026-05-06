import type {SystemCssProperties as CssStyle} from '@styled-system/css';
import type {PredefinedSize} from '../responsiveness';
import type {TextStyle, Theme} from '../theme';
import type {TextSize} from '.';
import {font} from '.';

describe('font', () => {
    const theme: Partial<Theme> = {
        fontSizes: {
            text: {
                xs: '1rem',
                sm: '2rem',
                md: '3rem',
                lg: '4rem',
                xl: '5rem',
            },
            display: {
                xs: '6rem',
                sm: '7rem',
                md: '8rem',
                lg: '9rem',
                xl: '10rem',
                '2xl': '11rem',
            },
        },
        lineHeights: {
            text: {
                xs: '1.5rem',
                sm: '2.5rem',
                md: '3.5rem',
                lg: '4.5rem',
                xl: '5.5rem',
            },
            display: {
                xs: '6.5rem',
                sm: '7.5rem',
                md: '8.5rem',
                lg: '9.5rem',
                xl: '10.5rem',
                '2xl': '11.5rem',
            },
        },
    };

    it.each<[TextStyle, PredefinedSize, CssStyle]>([
        [
            'text',
            'xs',
            {
                fontSize: '1rem',
                lineHeight: '1.5rem',
            },
        ],
        [
            'text',
            'sm',
            {
                fontSize: '2rem',
                lineHeight: '2.5rem',
            },
        ],
        [
            'text',
            'md',
            {
                fontSize: '3rem',
                lineHeight: '3.5rem',
            },
        ],
        [
            'text',
            'lg',
            {
                fontSize: '4rem',
                lineHeight: '4.5rem',
            },
        ],
        [
            'text',
            'xl',
            {
                fontSize: '5rem',
                lineHeight: '5.5rem',
            },
        ],
        [
            'display',
            'xs',
            {
                fontSize: '6rem',
                lineHeight: '6.5rem',
            },
        ],
        [
            'display',
            'sm',
            {
                fontSize: '7rem',
                lineHeight: '7.5rem',
            },
        ],
        [
            'display',
            'md',
            {
                fontSize: '8rem',
                lineHeight: '8.5rem',
            },
        ],
        [
            'display',
            'lg',
            {
                fontSize: '9rem',
                lineHeight: '9.5rem',
            },
        ],
        [
            'display',
            'xl',
            {
                fontSize: '10rem',
                lineHeight: '10.5rem',
            },
        ],
        [
            'display',
            '2xl',
            {
                fontSize: '11rem',
                lineHeight: '11.5rem',
            },
        ],
    ])('should build font %s with size %s', (style, size, css) => {
        const result = font(style, size as TextSize);

        const calculatedCss: Record<string, unknown> = {};

        Object.entries(result).forEach(([key, value]) => {
            calculatedCss[key] = typeof value === 'function' ? value(theme) : value;
        });

        expect(result).toEqual({
            fontSize: expect.any(Function),
            lineHeight: expect.any(Function),
        });

        expect(calculatedCss).toEqual(css);
    });

    it.each<number>([1, 2, 3, 4, 5])('should build font with a max of %s lines', (maxLines) => {
        const result = font('text', 'xs', {maxLines});

        const calculatedCss: Record<string, unknown> = {};

        Object.entries(result).forEach(([key, value]) => {
            calculatedCss[key] = typeof value === 'function' ? value(theme) : value;
        });

        expect(result).toEqual({
            fontSize: expect.any(Function),
            lineHeight: expect.any(Function),
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: maxLines,
        });

        expect(calculatedCss).toEqual({
            fontSize: '1rem',
            lineHeight: '1.5rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: maxLines,
        });
    });
});
