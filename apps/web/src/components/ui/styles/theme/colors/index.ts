import type {ComponentColors} from '../../../components/colors';
import type {ShadowColors} from '../../shadow/colors';
import {darkMode} from './dark';
import {lightMode} from './light';

export interface ColorMode {
    ui: {
        body: {
            text: string;
            background: string;
        };
        style: {
            shadow: ShadowColors;
        };
        component: ComponentColors;
    };
}

export type SemanticColors = 'neutral' | 'cautious' | 'dangerous' | 'emphasized' | 'positive' | 'informative';

export const colorModes = {
    light: lightMode,
    dark: darkMode,
} as const;

export type SupportedColorMode = keyof typeof colorModes;
