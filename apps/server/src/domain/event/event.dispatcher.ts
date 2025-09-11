import type {MaybeAuthenticatedActor} from '../@shared/actor';
import type {AggregateRoot} from '../@shared/entity';

export interface EventDispatcher {
    dispatch<A extends MaybeAuthenticatedActor, E extends AggregateRoot>(actor: A, aggregate: E): void;
}

export abstract class EventDispatcher {}
