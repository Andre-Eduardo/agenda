import type {Jsonify} from 'type-fest';
import type {Entity} from './entity.base';
import type {Identifier} from './id/identifier.base';

type AnyFunction = (...args: never) => unknown;

type NonFunctionPropertyNames<T> = {
    [K in keyof T]: T[K] extends AnyFunction ? never : K;
}[keyof T];

export type AllEntityProps<T extends Entity<Identifier<string>>> = FinalType<
    {
        [K in Exclude<NonFunctionPropertyNames<T>, 'events'> as K extends 'deletedAt' ? never : K]: T[K];
    } & {
        deletedAt?: Date | null;
    }
>;

export type EntityProperties = 'id' | 'createdAt' | 'updatedAt';

export type EntityProps<T extends Entity<Identifier<string>>> = Omit<AllEntityProps<T>, EntityProperties>;

export type CreateEntity<T extends Entity<Identifier<string>>> = Nullish<Omit<AllEntityProps<T>, EntityProperties>>;

type JsonifyObject<T extends object> = {
    [K in keyof T]: T[K] extends Set<infer S> ? S[] : Jsonify<T[K]>;
};

export type EntityJson<T extends Entity<Identifier<string>>> = JsonifyObject<AllEntityProps<T>>;
