export abstract class Identifier<T extends string> {
    /**
     * This is a requirement due to TS type-checking allowing classes with
     * exact same signature to be used interchangeably even with unrelated prototype chains.
     * Adding this private member to the class makes every object that does
     * not include the same property incompatible with it.
     * This is known as type branding.
     *
     * @example
     * // ===== Without branding:
     * class A extends Identifier {
     *   constructor() { super(); }
     * }
     * class B extends Identifier {}
     * const a: A = new A();
     * const b: (_: B) => void = () => {};
     * b(a); // No type error
     *
     * // ===== With branding:
     * class A extends Identifier<'A'> {}
     * class B extends Identifier<'B'> {}
     * const a: A = new A();
     * const b: (_: B) => void = () => {};
     * b(a); // Type 'A' is not assignable to type 'B'.
     */
    private readonly brand?: T;
}
