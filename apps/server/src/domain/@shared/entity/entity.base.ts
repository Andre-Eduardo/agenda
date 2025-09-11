import type {EntityJson} from './entity.types';
import type {Identifier} from './id/identifier.base';

export abstract class Entity<I extends Identifier<string>> {
    readonly id: I;

    readonly createdAt: Date;

    updatedAt: Date;

    protected constructor(props: {id: I; createdAt: Date; updatedAt: Date}) {
        this.id = props.id;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }

    protected update(date?: Date): void {
        this.updatedAt = date ?? new Date();
    }

    abstract toJSON(): EntityJson<Entity<I>>;
}
