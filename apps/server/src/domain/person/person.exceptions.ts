// eslint-disable-next-line unicorn/custom-error-definition -- domain exception class, 'Error' suffix breaks existing API
export class DuplicateDocumentIdException extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "DuplicateDocumentIdException";
  }
}
