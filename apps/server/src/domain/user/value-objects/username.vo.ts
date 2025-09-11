import {InvalidInputException} from '../../@shared/exceptions';

export class Username {
    // The username must be between 1 and 30 characters long and can only contain letters, numbers, hyphens, underscores, and periods.
    // Also, it cannot start or end with a period or contain two consecutive periods.
    private static readonly REGEX = /^(?!.*\.\.)(?!.*\.$)\w[\w.-]{0,29}$/i;

    private readonly value: string;

    constructor(value: string) {
        Username.validate(value);
        this.value = value;
    }

    static create(value: string): Username {
        return new Username(value);
    }

    static validate(value: string): void {
        if (!Username.REGEX.test(value)) {
            throw new InvalidInputException(
                'The username must be between 1 and 30 characters long and ' +
                    'can only contain letters, numbers, hyphens, underscores, and periods.'
            );
        }
    }

    equals(other: unknown): other is this {
        return other instanceof Username && this.value.toLowerCase() === other.value.toLowerCase();
    }

    toString(): string {
        return this.value;
    }

    toJSON(): string {
        return this.value;
    }
}
