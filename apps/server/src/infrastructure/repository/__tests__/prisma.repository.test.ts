import {Prisma} from '@prisma/client';
import type {Sort} from '../../../domain/@shared/repository';
import type {FOREIGN_KEY_CONSTRAINT_VIOLATION, PrismaViolation, UNIQUE_CONSTRAINT_VIOLATION} from '../prisma';
import {PrismaRepository} from '../prisma.repository';

class PrismaRepositoryTest extends PrismaRepository {
    normalizeSort<T extends Sort<string[]>, E extends Record<string, Prisma.SortOrder>>(
        sort?: T,
        extraSort?: E
    ): Array<T | E> {
        return super.normalizeSort(sort, extraSort);
    }

    isPrismaViolation(error: unknown): error is Prisma.PrismaClientKnownRequestError {
        return super.isPrismaViolation(error);
    }

    isUniqueConstraintViolation(error: unknown): error is PrismaViolation<typeof UNIQUE_CONSTRAINT_VIOLATION> {
        return super.isUniqueConstraintViolation(error);
    }

    isForeignKeyConstraintViolation(error: unknown): error is PrismaViolation<typeof FOREIGN_KEY_CONSTRAINT_VIOLATION> {
        return super.isForeignKeyConstraintViolation(error);
    }

    checkUniqueViolation(error: unknown, ...target: string[]): boolean {
        return super.checkUniqueViolation(error, ...target);
    }

    checkForeignKeyViolation(error: unknown, ...target: string[]): boolean {
        return super.checkForeignKeyViolation(error, ...target);
    }
}

describe('A Prisma repository', () => {
    const repository = new PrismaRepositoryTest();

    it('should normalize sort', () => {
        expect(
            repository.normalizeSort({
                foo: 'asc',
                bar: 'asc',
            })
        ).toEqual([{foo: 'asc'}, {bar: 'asc'}]);
    });

    it('should normalize sort and add extra sort', () => {
        expect(
            repository.normalizeSort(
                {
                    foo: 'asc',
                    bar: 'asc',
                },
                {
                    baz: 'desc',
                }
            )
        ).toEqual([{foo: 'asc'}, {bar: 'asc'}, {baz: 'desc'}]);
    });

    it('should normalize empty sort options', () => {
        expect(repository.normalizeSort()).toEqual([]);
    });

    it('should check if the error is a Prisma violation', () => {
        const error = new Prisma.PrismaClientKnownRequestError('message', {
            code: 'P1000',
            clientVersion: '0.0.0',
        });

        expect(repository.isPrismaViolation(error)).toBe(true);
    });

    it('should check if the error is a unique constraint violation', () => {
        const error = new Prisma.PrismaClientKnownRequestError('message', {
            code: 'P2002',
            clientVersion: '0.0.0',
        });

        expect(repository.isUniqueConstraintViolation(error)).toBe(true);
    });

    it('should check if the error is a foreign key constraint violation', () => {
        const error = new Prisma.PrismaClientKnownRequestError('message', {
            code: 'P2003',
            clientVersion: '0.0.0',
        });

        expect(repository.isForeignKeyConstraintViolation(error)).toBe(true);
    });

    it.each([
        [
            {
                code: 'P2002',
                meta: {
                    target: ['target'],
                },
            },
            true,
        ],
        [
            {
                code: 'P2002',
                meta: {
                    target: ['other-target'],
                },
            },
            false,
        ],
        [
            {
                code: 'P2002',
                meta: {
                    target: 'target',
                },
            },
            false,
        ],
        [
            {
                code: 'P2003',
                meta: {
                    target: ['target'],
                },
            },
            false,
        ],
        [
            {
                code: 'P2003',
            },
            false,
        ],
    ])('should check if the error is a unique constraint violation for a specific target', (errorParams, expected) => {
        const error = new Prisma.PrismaClientKnownRequestError('message', {
            ...errorParams,
            clientVersion: '0.0.0',
        });

        expect(repository.checkUniqueViolation(error, 'target')).toBe(expected);
    });

    it.each([
        [
            {
                code: 'P2003',
                meta: {
                    field_name: 'target (index)',
                },
            },
            true,
        ],
        [
            {
                code: 'P2003',
                meta: {
                    target: ['target'],
                },
            },
            false,
        ],
        [
            {
                code: 'P2002',
                meta: {
                    field_name: 'target (index)',
                },
            },
            false,
        ],
    ])(
        'should check if the error is a foreign key constraint violation for a specific target',
        (errorParams, expected) => {
            const error = new Prisma.PrismaClientKnownRequestError('message', {
                ...errorParams,
                clientVersion: '0.0.0',
            });

            expect(repository.checkForeignKeyViolation(error, 'target')).toBe(expected);
        }
    );
});
