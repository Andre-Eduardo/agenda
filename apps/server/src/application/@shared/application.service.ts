import type {Actor, MaybeAuthenticatedActor} from '../../domain/@shared/actor';

export type Command<P = undefined, A extends MaybeAuthenticatedActor = Actor> = {
    actor: A;
    payload: P;
};

export interface ApplicationService<I = undefined, O = void, A extends MaybeAuthenticatedActor = Actor> {
    execute(command: Command<I, A>): Promise<O>;
}
