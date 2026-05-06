import {Suspense} from 'react';
import type {FC, PropsWithChildren, ReactElement} from 'react';
import type {RenderResult} from '@testing-library/react';
import {render as renderTestingLibrary} from '@testing-library/react';
import i18next from 'i18next';
import type {PartialDeep} from 'type-fest';
import {UiProvider} from '../../UiProvider';
import type {Locale} from '../../components/Locale';
import {createThemeCache} from '../../components/Theme';
import {darkMode} from '../../styles/theme/colors/dark';
import {lightMode} from '../../styles/theme/colors/light';
import type {Dictionary, Translation} from '../../translations';

export type PartialTranslation = PartialDeep<Dictionary<Translation>>;

const locale: Locale = {
    code: 'en-US',
    timeZone: 'UTC',
};

const cache = createThemeCache();

type ProvidersProps = Pick<RenderProps, 'translation'>;

const Providers: FC<PropsWithChildren<ProvidersProps>> = (props) => {
    const {children, translation = {}} = props;
    const i18n = i18next.createInstance({
        lng: locale.code,
        supportedLngs: [locale.code],
        resources: {
            [locale.code]: translation,
        },
    });

    // eslint-disable-next-line @typescript-eslint/no-floating-promises -- No need to wait the i18n initialization
    i18n.init();

    return (
        <UiProvider
            colorModes={{light: lightMode, dark: darkMode}}
            defaultMode="light"
            themeCache={cache}
            i18n={i18n}
            locale={locale}
        >
            {children}
        </UiProvider>
    );
};

type RenderProps = {
    component: ReactElement;
    translation?: PartialTranslation;
};

export const render = (renderProps: RenderProps | ReactElement): RenderResult => {
    const {component, translation}: RenderProps = 'component' in renderProps ? renderProps : {component: renderProps};

    return renderTestingLibrary(component, {
        wrapper: (props) => (
            <Suspense fallback={<h1>Loading...</h1>}>
                <Providers translation={translation} {...props} />
            </Suspense>
        ),
    });
};
