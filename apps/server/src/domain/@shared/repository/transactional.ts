import { Inject } from "@nestjs/common";

export interface AtomicExecutor {
  runAtomically<R>(callback: () => Promise<R>, propagation?: Propagation): Promise<R>;

  /**
   * Run the given callback after the current atomic execution completes.
   *
   * Since the callback will not start until the end of the surrounding context, no data can be passed back
   * from the callback to the callee.
   *
   * The callback should only be executed if the atomic context ended successfully.
   * Any changes made by the atomic executor have been committed at this point.
   *
   * @param {() => (void)} callback
   */
  defer(callback: () => void): void;
}

export abstract class AtomicExecutor {}

export enum Propagation {
  /**
   * If a transaction exists, it executes within that transaction. Otherwise, creates a new transaction.
   */
  REQUIRED = "REQUIRED",
  /**
   * If a transaction exists, it creates an inner independent transaction. Otherwise, creates a new transaction.
   */
  NESTED = "NESTED",
}

export function Transactional(propagation?: Propagation): MethodDecorator {
  const injectAtomicExecutor = Inject(AtomicExecutor);

  return (target: NonNullable<unknown>, _, descriptor: PropertyDescriptor) => {
    injectAtomicExecutor(target, "atomicExecutor");

    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    // eslint-disable-next-line no-param-reassign -- Needed for the decorator
    descriptor.value = function atomic(...args: unknown[]) {
      const { atomicExecutor } = this as { atomicExecutor: AtomicExecutor };

      return atomicExecutor.runAtomically(() => originalMethod.apply(this, args), propagation);
    };
  };
}
