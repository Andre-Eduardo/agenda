import type {SystemCssProperties as CssStyle} from '..';
import type {TextStyle, TextTheme, Theme} from '../theme';

export type TextSize<F extends TextStyle = TextStyle> = keyof TextTheme[F];

export type FontOptions = {
    maxLines?: number;
};

export function font<T extends TextStyle>(style: T, size: TextSize<T>, options?: FontOptions): CssStyle {
    const getSize = (theme: Theme, prop: 'fontSizes' | 'lineHeights'): string => theme[prop][style][size as TextSize];

    const css: CssStyle = {
        fontSize: (theme: Theme): string => getSize(theme, 'fontSizes'),
        lineHeight: (theme: Theme): string => getSize(theme, 'lineHeights'),
    };

    const {maxLines} = options ?? {};

    if (maxLines && maxLines > 0) {
        css.overflow = 'hidden';
        css.textOverflow = 'ellipsis';
        css.display = '-webkit-box';
        css.WebkitBoxOrient = 'vertical';
        css.WebkitLineClamp = maxLines;
    }

    return css;
}
