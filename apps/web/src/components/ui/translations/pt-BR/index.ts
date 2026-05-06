import type {Dictionary, Translation} from '..';
import * as components from './components';
import countries from './countries.json';

const ptBr: Dictionary<Translation> = {
    ui: {
        component: components,
    },
    country: {
        list: countries,
    },
};

export default ptBr;
