import validator from 'validator';

export class Email {
  private readonly value: string;

  constructor(value: string) {
    Email.validate(value);
    this.value = value;
  }

  static create(value: string): Email {
    return new Email(value);
  }

  static validate(value: string): void {
    if (!validator.isEmail(value)) {
      throw new Error(`Invalid email format: ${value}`);
    }
  }

  static isValid(value: string): boolean {
    return validator.isEmail(value);
  }

  equals(other: unknown): other is this {
    return (
      other instanceof Email &&
      this.value.toLowerCase() === other.value.toLowerCase()
    );
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}
