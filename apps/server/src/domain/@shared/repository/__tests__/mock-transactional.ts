import {mockDeep} from 'jest-mock-extended';
import type {AtomicExecutor} from '../transactional';

export function mockTransactional<T extends NonNullable<unknown>>(target: T): AtomicExecutor {
    const atomicExecutor = mockDeep<AtomicExecutor>({
        runAtomically<R>(callback: () => Promise<R>): Promise<R> {
            return callback();
        },
    });

    jest.spyOn(atomicExecutor, 'runAtomically');

    Object.assign(target, {atomicExecutor});

    return atomicExecutor;
}
