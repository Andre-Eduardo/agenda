/// <reference types="jest-extended" />

import type {MaybeAuthenticatedActor} from './domain/@shared/actor';
import type {ExpressContextActions} from './infrastructure/auth';

declare global {
    namespace Express {
        interface Request {
            actor: MaybeAuthenticatedActor;
        }

        interface Response {
            actions: ExpressContextActions;
        }
    }
}
