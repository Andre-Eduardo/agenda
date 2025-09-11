import validator from 'validator';
import {InvalidInputException} from '../exceptions';

export class Phone {
    private readonly value: string;

    constructor(value: string) {
        Phone.validate(value);
        this.value = value.replaceAll(/\D/g, '');
    }

    static create(value: string): Phone {
        return new Phone(value);
    }

    static validate(value: string): void {
        if (!validator.isMobilePhone(value)) {
            throw new InvalidInputException('Invalid phone format.');
        }
    }

    equals(other: unknown): other is this {
        return other instanceof Phone && this.value === other.value;
    }

    toString(): string {
        return this.value;
    }

    toJSON(): string {
        return this.value;
    }
}
