export type Equatable = {
    equals(other: unknown): boolean;
};

export function isEquatable(value: unknown): value is Equatable {
    return typeof (value as Equatable)?.equals === 'function';
}
