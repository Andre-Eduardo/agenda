import type {Theme as StyledTheme} from 'styled-system';
import type {SystemStyleObject} from '..';
import type {PredefinedSize} from '../responsiveness';
import type {ColorMode} from './colors';

export type TextSize = Exclude<PredefinedSize, '2xl'>;
export type DisplaySize = PredefinedSize;

export type TextTheme = {
    text: Record<TextSize, string>;
    display: Record<DisplaySize, string>;
};

export type TextStyle = keyof TextTheme;

export type FontWeight = keyof Theme['fontWeights'];

export interface Theme extends Omit<StyledTheme, 'colors' | 'space' | 'sizes' | 'radii'> {
    colors: ColorMode;
    fonts: {
        default: string;
        monospace: string;
    };
    fontSizes: TextTheme;
    lineHeights: TextTheme;
    fontWeights: {
        extraLight: number;
        regular: number;
        medium: number;
        semibold: number;
        bold: number;
    };
    space: ThemeSpacing & {
        none: string;
        xxs: string;
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        '2xl': string;
        '3xl': string;
        '4xl': string;
        '5xl': string;
        '6xl': string;
        '7xl': string;
        '8xl': string;
        '9xl': string;
        '10xl': string;
        '11xl': string;
    };
    sizes: ThemeSpacing & {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        '2xl': string;
    };
    radii: {
        none: string;
        xxs: string;
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        '2xl': string;
        '3xl': string;
        '4xl': string;
        full: string;
    };
    root?: SystemStyleObject;
}

export interface ThemeSpacing {
    0: string;
    0.5: string;
    1: string;
    1.5: string;
    2: string;
    2.25: string;
    2.5: string;
    2.75: string;
    3: string;
    3.5: string;
    3.75: string;
    4: string;
    4.5: string;
    5: string;
    5.5: string;
    6: string;
    6.5: string;
    7: string;
    7.5: string;
    8: string;
    9: string;
    10: string;
    11: string;
    12: string;
    13: string;
    14: string;
    15: string;
    16: string;
    18: string;
    20: string;
    24: string;
    26: string;
    28: string;
    30: string;
    32: string;
    40: string;
    44: string;
    48: string;
    50: string;
    56: string;
    60: string;
    64: string;
    70: string;
    72: string;
    80: string;
    96: string;
    112: string;
    128: string;
}
