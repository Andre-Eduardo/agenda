import chai = require('chai');
import * as chaiMatchPattern from 'chai-match-pattern';
import chaiSubset = require('chai-subset');
import {UUID} from 'uuidv7';

chai.use(chaiMatchPattern);
const _ = chaiMatchPattern.getLodashModule();

_.mixin({
    isEntityId: (value: unknown): boolean => {
        try {
            if (!_.isString(value)) {
                return false;
            }

            UUID.parse(value);

            return true;
        } catch (error) {
            return false;
        }
    },
});

chai.use(chaiSubset);
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Disabled to use chai globally
(global as any).chai = chai;
