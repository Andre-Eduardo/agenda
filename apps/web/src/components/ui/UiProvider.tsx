import type {FC, PropsWithChildren} from 'react';
import type {LocaleProviderProps} from './components/Locale';
import {LocaleProvider} from './components/Locale';
import type {ThemeProviderProps} from './components/Theme';
import {ThemeProvider} from './components/Theme';

export type UiProviderProps = LocaleProviderProps & ThemeProviderProps;

export const UiProvider: FC<PropsWithChildren<UiProviderProps>> = (props) => {
    const {
        children,
        locale,
        i18n,
        colorModes,
        mode,
        defaultMode,
        themeCache,
        fonts,
        root,
        onLanguageChange,
        onColorModeChange,
    } = props;

    return (
        <LocaleProvider locale={locale} i18n={i18n} onLanguageChange={onLanguageChange}>
            <ThemeProvider
                colorModes={colorModes}
                mode={mode}
                defaultMode={defaultMode}
                themeCache={themeCache}
                fonts={fonts}
                root={root}
                onColorModeChange={onColorModeChange}
            >
                {children}
            </ThemeProvider>
        </LocaleProvider>
    );
};
