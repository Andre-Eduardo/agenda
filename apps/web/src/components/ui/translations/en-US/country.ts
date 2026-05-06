import type {Dictionary, Translation} from '..';
import countries from './countries.json';

const country: Dictionary<Translation['country']> = {
    list: countries,
};

export default country;
