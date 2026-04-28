import {randomUUID} from 'crypto';
import {Injectable} from '@nestjs/common';
import {Prisma} from '@prisma/client';
import {ClsService} from 'nestjs-cls';
import {AtomicExecutor, Propagation} from '../../../domain/@shared/repository';
import {PrismaService} from './prisma.service';

export type ProviderState = {
    txContext?: {
        transaction: PrismaService;
        rootPromise: Promise<unknown>;
    };
};

@Injectable()
export class PrismaProvider implements AtomicExecutor {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cls: ClsService<ProviderState>
    ) {}

    get client(): PrismaService {
        return this.state?.transaction ?? this.prisma;
    }

    private get state(): ProviderState['txContext'] {
        return this.cls.get('txContext');
    }

    /**
     * Runs the callback within a transaction context.
     */
    async runAtomically<R>(callback: () => Promise<R>, propagation: Propagation = Propagation.REQUIRED): Promise<R> {
        const {state} = this;

        if (state != null) {
            if (propagation === Propagation.NESTED) {
                return runSubTransaction(state.transaction, callback);
            }

            return callback();
        }

        const promise: Promise<R> = this.prisma.$transaction(
            /* istanbul ignore next */
            (transaction) =>
                this.cls.runWith(
                    {
                        txContext: {
                            transaction: createTransactionProxy(transaction),
                            rootPromise: promise,
                        },
                    },
                    callback
                )
        );

        return promise;
    }

    defer(callback: () => void): void {
        const {state} = this;

        if (state === undefined) {
            callback();

            return;
        }

        state.rootPromise
            .then(() => this.cls.exit(callback))
            .catch(() => {
                // Errors on the root promise should be handled by the `runAtomically` call that created it,
                // but since this promise is chained from that it is also rejected.
                // This promise is also rejected if the deferred callback throws or rejects, which should not happen
                // since those are executed outside their original scope (deferred to _after_ their scope ends).
                // Errors should be handled by the callback itself (probably by logging them).
                // Both scenarios may result in an unhandled rejected promise which throws an error on Node 18+, so an
                // explicit empty catch must be present to ignore this rejection.
            });
    }
}

export function createTransactionProxy<T extends Prisma.TransactionClient>(transaction: T): PrismaService {
    return new Proxy(transaction, {
        get(_, prop, receiver) {
            if (prop === '$transaction') {
                return async function $transaction(...args: unknown[]) {
                    if (typeof args[0] === 'function') {
                        const callback = args[0] as (transaction: Prisma.TransactionClient) => Promise<unknown>;
                        const options = args[1] as {propagation?: Propagation};

                        if (options?.propagation === Propagation.NESTED) {
                            return runSubTransaction(transaction, () => callback(transaction));
                        }

                        return callback(transaction);
                    }

                    if (Array.isArray(args[0])) {
                        const promises = args[0] as Array<Prisma.PrismaPromise<unknown>>;
                        const options = args[1] as {propagation?: Propagation};

                        if (options?.propagation === Propagation.NESTED) {
                            return runSubTransaction(transaction, () => Promise.all(promises));
                        }

                        return Promise.all(promises);
                    }

                    throw new Error('Unsupported $transaction call');
                };
            }

            if (typeof prop === 'string' && !(prop in transaction)) {
                throw new Error(`Method "${prop}" is not allowed within a transaction context`);
            }

            return Reflect.get(_, prop, receiver);
        },
    }) as unknown as PrismaService;
}

async function runSubTransaction<T>(transaction: Prisma.TransactionClient, callback: () => Promise<T>): Promise<T> {
    const savepointName = randomUUID();

    await transaction.$executeRawUnsafe(`SAVEPOINT "${savepointName}";`);

    try {
        const result = await callback();

        await transaction.$executeRawUnsafe(`RELEASE SAVEPOINT "${savepointName}";`);

        return result;
    } catch (error) {
        await transaction.$executeRawUnsafe(`ROLLBACK TO "${savepointName}";`);

        throw error;
    }
}
