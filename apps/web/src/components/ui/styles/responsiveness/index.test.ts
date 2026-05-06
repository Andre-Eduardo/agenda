import type {SystemCssProperties} from '..';
import type {BreakpointRule} from './breakpoints';
import type {ResponsiveMapping} from '.';
import {responsive, responsiveStyle} from '.';

describe('responsiveStyle', () => {
    it.each<[ResponsiveMapping, SystemCssProperties]>([
        [
            {
                _: {marginTop: 1},
                xs: {marginRight: 2},
                sm: {marginBottom: 3},
                md: {marginLeft: 4},
                lg: {paddingTop: 5},
                xl: {paddingRight: 6},
                '2xl': {paddingBottom: 7},
            },
            {
                marginTop: [1, null, null, null, null, null, null],
                marginRight: [null, 2, null, null, null, null, null],
                marginBottom: [null, null, 3, null, null, null, null],
                marginLeft: [null, null, null, 4, null, null, null],
                paddingTop: [null, null, null, null, 5, null, null],
                paddingRight: [null, null, null, null, null, 6, null],
                paddingBottom: [null, null, null, null, null, null, 7],
            },
        ],
        [
            {
                _: {height: 1, width: 7},
                xs: {height: 2, width: 6},
                sm: {height: 3, width: 5},
                md: {height: 4, width: 4},
                lg: {height: 5, width: 3},
                xl: {height: 6, width: 2},
                '2xl': {height: 7, width: 1},
            },
            {
                height: [1, 2, 3, 4, 5, 6, 7],
                width: [7, 6, 5, 4, 3, 2, 1],
            },
        ],
        [
            {
                _: {height: 1, width: 7},
                sm: {height: 3, width: 5},
                md: {height: 4, width: 4},
                lg: {height: 5, width: 3},
                xl: {height: 6, width: 2},
                '2xl': {height: 7, width: 1},
            },
            {
                height: [1, null, 3, 4, 5, 6, 7],
                width: [7, null, 5, 4, 3, 2, 1],
            },
        ],
        [
            {
                _: {height: 1, width: 7},
                xs: {height: 2, width: 6},
                md: {height: 4, width: 4},
                lg: {height: 5, width: 3},
                xl: {height: 6, width: 2},
                '2xl': {height: 7, width: 1},
            },
            {
                height: [1, 2, null, 4, 5, 6, 7],
                width: [7, 6, null, 4, 3, 2, 1],
            },
        ],
        [
            {
                _: {height: 1, width: 7},
                xs: {height: 2, width: 6},
                sm: {height: 3, width: 5},
                lg: {height: 5, width: 3},
                xl: {height: 6, width: 2},
                '2xl': {height: 7, width: 1},
            },
            {
                height: [1, 2, 3, null, 5, 6, 7],
                width: [7, 6, 5, null, 3, 2, 1],
            },
        ],
        [
            {
                _: {height: 1, width: 7},
                xs: {height: 2, width: 6},
                sm: {height: 3, width: 5},
                md: {height: 4, width: 4},
                xl: {height: 6, width: 2},
                '2xl': {height: 7, width: 1},
            },
            {
                height: [1, 2, 3, 4, null, 6, 7],
                width: [7, 6, 5, 4, null, 2, 1],
            },
        ],
        [
            {
                _: {height: 1, width: 7},
                xs: {height: 2, width: 6},
                sm: {height: 3, width: 5},
                md: {height: 4, width: 4},
                lg: {height: 5, width: 3},
                '2xl': {height: 7, width: 1},
            },
            {
                height: [1, 2, 3, 4, 5, null, 7],
                width: [7, 6, 5, 4, 3, null, 1],
            },
        ],
        [
            {
                _: {height: 1, width: 7},
                xs: {height: 2, width: 6},
                sm: {height: 3, width: 5},
                md: {height: 4, width: 4},
                lg: {height: 5, width: 3},
                xl: {height: 6, width: 2},
            },
            {
                height: [1, 2, 3, 4, 5, 6, null],
                width: [7, 6, 5, 4, 3, 2, null],
            },
        ],
    ])('should convert %o into %o', (mapping, style) => {
        expect(responsiveStyle(mapping)).toStrictEqual(style);
    });

    it.each<[string, ResponsiveMapping, SystemCssProperties]>([
        [
            'xs',
            {
                _: {height: 1, width: 7},
                xs: {height: 2, width: 6},
                sm: {height: 3, width: 5},
                md: {height: 4, width: 4},
                lg: {height: 5, width: 3},
                xl: {height: 6, width: 2},
            },
            {
                height: 2,
                width: 6,
            },
        ],
        [
            'lg',
            {
                _: {height: 1, width: 7},
                xs: {height: 2, width: 6},
                sm: {height: 3, width: 5},
                md: {height: 4, width: 4},
                lg: {height: 5, width: 3},
                xl: {height: 6, width: 2},
            },
            {
                height: 5,
                width: 3,
            },
        ],
        [
            'lg',
            {
                _: {height: 1, width: 7},
                xs: {height: 2, width: 6},
                sm: {height: 3, width: 5},
                md: {height: 4, width: 4},
                lg: {height: 5, width: 3},
                xl: {height: 6, width: 2},
            },
            {
                height: 5,
                width: 3,
            },
        ],
    ])('should convert into a statically style', (mapping, aliases, style) => {
        expect(responsiveStyle(mapping, aliases)).toStrictEqual(style);
    });

    it.each<[Partial<Record<BreakpointRule, PropertyKey>>, ResponsiveMapping, SystemCssProperties]>([
        [
            {
                _: '_',
                xs: 'xs',
                sm: 'sm',
                md: 'md',
                lg: 'lg',
                xl: 'xl',
                '2xl': '2xl',
            },
            {
                _: {marginTop: 1},
                xs: {marginRight: 2},
                sm: {marginBottom: 3},
                md: {marginLeft: 4},
                lg: {paddingTop: 5},
                xl: {paddingRight: 6},
                '2xl': {paddingBottom: 7},
            },
            {
                marginTop: [1, null, null, null, null, null, null],
                marginRight: [null, 2, null, null, null, null, null],
                marginBottom: [null, null, 3, null, null, null, null],
                marginLeft: [null, null, null, 4, null, null, null],
                paddingTop: [null, null, null, null, 5, null, null],
                paddingRight: [null, null, null, null, null, 6, null],
                paddingBottom: [null, null, null, null, null, null, 7],
            },
        ],
        [
            {
                _: 'sm',
                xs: 'xs',
                sm: 'sm',
                md: 'md',
                lg: 'lg',
                xl: 'xl',
                '2xl': '2xl',
            },
            {
                xs: {height: 2, width: 6},
                sm: {height: 3, width: 5},
                md: {height: 4, width: 4},
                lg: {height: 5, width: 3},
                xl: {height: 6, width: 2},
                '2xl': {height: 7, width: 1},
            },
            {
                height: [3, 2, 3, 4, 5, 6, 7],
                width: [5, 6, 5, 4, 3, 2, 1],
            },
        ],
        [
            {
                _: 'sm',
                md: 'lg',
            },
            {
                xs: {height: 2, width: 6},
                sm: {height: 3, width: 5},
                md: {height: 4, width: 4},
                lg: {height: 5, width: 3},
                xl: {height: 6, width: 2},
                '2xl': {height: 7, width: 1},
            },
            {
                height: [3, null, null, 5, null, null, null],
                width: [5, null, null, 3, null, null, null],
            },
        ],
    ])('should convert into a responsive style', (mapping, aliases, style) => {
        expect(responsiveStyle(mapping, aliases)).toStrictEqual(style);
    });
});

describe('responsive', () => {
    it.each<
        [
            {[key in BreakpointRule]?: string | number},
            {[key: string]: string | number} | undefined,
            Array<string | number | null>,
        ]
    >([
        [
            {
                _: 5,
                xs: 10,
                sm: 15,
                md: 20,
                lg: 25,
                xl: 30,
                '2xl': 35,
            },
            undefined,
            [5, 10, 15, 20, 25, 30, 35],
        ],
        [
            {
                _: 5,
                sm: 10,
                lg: 20,
            },
            undefined,
            [5, null, 10, null, 20, null, null],
        ],
        [
            {
                md: 20,
            },
            undefined,
            [null, null, null, 20, null, null, null],
        ],
        [
            {
                _: 'sm',
                xs: 'xs',
                sm: 'sm',
                md: 'lg',
                xl: 'xl',
                '2xl': '2xl',
            },
            {
                xs: 5,
                sm: 10,
                lg: 15,
                xl: 20,
                '2xl': 25,
            },
            [10, 5, 10, 15, null, 20, 25],
        ],
        [
            {
                xs: 'xs',
                sm: 'sm',
                md: 'lg',
                xl: 'xl',
                '2xl': '2xl',
            },
            {
                xs: 8,
                sm: 10,
                lg: 12,
                xl: 17,
                '2xl': 19,
            },
            [null, 8, 10, 12, null, 17, 19],
        ],
        [
            {
                _: 'md',
            },
            {
                md: 15,
            },
            [15, null, null, null, null, null, null],
        ],
        [
            {
                _: 'xl',
                xs: 'xs',
                sm: 'sm',
                md: 'md',
                lg: 'lg',
                xl: 'xl',
                '2xl': '2xl',
            },
            {
                xs: 1,
                sm: 2,
                md: 3,
                lg: 4,
                xl: 5,
                '2xl': 6,
            },
            [5, 1, 2, 3, 4, 5, 6],
        ],
    ])('should convert %o into %o', (mapping, aliases, style) => {
        expect(responsive(mapping, aliases)).toStrictEqual(style);
    });
});
