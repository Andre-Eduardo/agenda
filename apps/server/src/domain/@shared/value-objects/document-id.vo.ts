import { InvalidInputException } from "@domain/@shared/exceptions";

export class DocumentId {
  private static readonly REGEX = /^(?!.*[./-]{2})(?!.*[./-]$)(?!.*^[./-])[0-9]+([./-][0-9]+)*$/i;

  private readonly value: string;

  constructor(value: string) {
    DocumentId.validate(value);
    this.value = value.replaceAll(/[.-]/g, "");
  }

  static create(value: string): DocumentId {
    return new DocumentId(value);
  }

  static validate(value: string): void {
    if (!DocumentId.REGEX.test(value)) {
      throw new InvalidInputException("Invalid document ID format.");
    }
  }

  equals(other: unknown): other is this {
    return other instanceof DocumentId && this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}
