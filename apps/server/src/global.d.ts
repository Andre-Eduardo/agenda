/**
 * Make the properties of the type T that are in the type K optional.
 */
declare type PickPartial<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;

/**
 * Make a type assembled from several types/utilities more readable by showing the final resulting.
 */
declare type FinalType<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

/**
 * Override the existing properties of the type T with the properties of the type U.
 */
declare type Override<T, U extends Record<PropertyKey, unknown>> = FinalType<Omit<T, keyof U> & U>;

/**
 * Extract the properties of the type T that are nullable.
 */
declare type ExtractNullable<T> = {
  [K in keyof T as T[K] extends infer U ? (U extends null ? K : never) : never]: T[K];
};

/**
 * Make the properties of the type T that are nullable to be nullish (null | undefined).
 */
declare type Nullish<T> = FinalType<PickPartial<T, keyof ExtractNullable<T>>>;
