import validator from "validator";
import { InvalidInputException } from "@domain/@shared/exceptions";

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
      throw new InvalidInputException("Invalid email format.");
    }
  }

  equals(other: unknown): other is this {
    return other instanceof Email && this.value.toLowerCase() === other.value.toLowerCase();
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}
