import {uuidv7, UUID} from 'uuidv7';
import {Identifier} from './identifier.base';

export abstract class EntityId<T extends string> extends Identifier<T> {
    private readonly value: string;

    protected constructor(value?: string) {
        super();
        this.value = EntityId.generateId(value);
    }

    private static generateId(value?: string): string {
        if (value === undefined) {
            return uuidv7();
        }

        try {
            UUID.parse(value);
        } catch {
            throw new SyntaxError('The identifier must be a valid UUID.');
        }

        return value;
    }

    equals(other: unknown): other is this {
        return other instanceof EntityId && other instanceof this.constructor && this.value === other.value;
    }

    toString(): string {
        return this.value;
    }

    toJSON(): string {
        return this.value;
    }
}
