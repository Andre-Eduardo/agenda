import type {Jsonify} from 'type-fest';
import type {Entity} from './entity.base';
import type {Identifier} from './id/identifier.base';

type AnyFunction = (...args: never) => unknown;

type NonFunctionPropertyNames<T> = {
    [K in keyof T]: T[K] extends AnyFunction ? never : K;
}[keyof T];

export type AllEntityProps<T extends Entity<Identifier<string>>> = FinalType<
    Pick<
        T,
        // Getters are treated as non-functions by TypeScript
        Exclude<NonFunctionPropertyNames<T>, 'events'>
    >
>;

export type EntityProperties = 'id' | 'createdAt' | 'updatedAt';

export type EntityProps<T extends Entity<Identifier<string>>> = Omit<AllEntityProps<T>, EntityProperties>;

export type CreateEntity<T extends Entity<Identifier<string>>> = Nullish<Omit<AllEntityProps<T>, EntityProperties>>;

type JsonifyObject<T extends object> = {
    [K in keyof T]: T[K] extends Set<infer S> ? S[] : Jsonify<T[K]>;
};

export type EntityJson<T extends Entity<Identifier<string>>> = JsonifyObject<AllEntityProps<T>>;
