// eslint-disable-next-line unicorn/custom-error-definition -- domain exception class, 'Error' suffix breaks existing API
export class DuplicateUsernameException extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "DuplicateUsernameException";
  }
}

// eslint-disable-next-line unicorn/custom-error-definition -- domain exception class, 'Error' suffix breaks existing API
export class DuplicateEmailException extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "DuplicateEmailException";
  }
}
