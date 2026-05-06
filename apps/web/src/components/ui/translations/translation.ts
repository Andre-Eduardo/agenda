import type {ComponentTranslations} from '../components/translations';

export interface Translation {
    ui: {
        component: ComponentTranslations;
    };
    country: {
        list: Record<string, string>;
    };
}
