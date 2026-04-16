import chai from 'chai';
import chaiMatchPattern from 'chai-match-pattern';
import chaiSubset from 'chai-subset';

chai.use(chaiMatchPattern);
chai.use(chaiSubset);

export {chai};
