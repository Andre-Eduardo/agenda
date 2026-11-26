import {Prisma} from '@prisma/client';
import {mockDeep} from 'jest-mock-extended';
import type {Pagination, Sort} from '@domain/@shared/repository';
import type {OrderBy} from '@infrastructure/repository/prisma.repository';
import {PrismaRepository} from '@infrastructure/repository/prisma.repository';
import type {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';
import type {
    FOREIGN_KEY_CONSTRAINT_VIOLATION,
    PrismaViolation,
    UNIQUE_CONSTRAINT_VIOLATION,
} from '@infrastructure/repository/prisma/prisma.violations';

type SortKeys = ['foo', 'bar', 'nested.baz'];

class PrismaRepositoryTest extends PrismaRepository {
    buildOrderBy<E extends Record<string, Prisma.SortOrder>>(sort?: Array<Sort<SortKeys>>, extraSort?: E): OrderBy[] {
        return this.normalizeSort(sort, extraSort);
    }

    paginate<E extends Record<string, Prisma.SortOrder>>(pagination: Pagination<SortKeys>, extraSort?: E) {
        return this.normalizePagination(pagination, extraSort);
    }

    softDeleteData(): {deletedAt: Date; updatedAt: Date} {
        return super.softDeleteData();
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

    checkForeignKeyViolation(error: unknown, target?: string): boolean {
        return super.checkForeignKeyViolation(error, target);
    }
}

describe('A Prisma repository', () => {
    const repository = new PrismaRepositoryTest(mockDeep<PrismaProvider>());

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should normalize sort', () => {
        expect(
            repository.buildOrderBy([
                {key: 'foo', direction: 'asc'},
                {key: 'bar', direction: 'desc'},
            ])
        ).toEqual([{foo: 'asc'}, {bar: 'desc'}]);
    });

    it('should normalize nested sort keys', () => {
        expect(repository.buildOrderBy([{key: 'nested.baz', direction: 'asc'}])).toEqual([{nested: {baz: 'asc'}}]);
    });

    it('should normalize sort and add extra sort', () => {
        expect(repository.buildOrderBy([{key: 'foo', direction: 'asc'}], {id: 'desc'})).toEqual([
            {foo: 'asc'},
            {id: 'desc'},
        ]);
    });

    it('should normalize empty sort options', () => {
        expect(repository.buildOrderBy()).toEqual([]);
    });

    it.each([
        [{limit: 10}, {skip: undefined, take: 10, orderBy: []}],
        [
            {limit: 10, page: 1},
            {skip: undefined, take: 10, orderBy: []},
        ],
        [
            {limit: 10, page: 3},
            {skip: 20, take: 10, orderBy: []},
        ],
        [
            {limit: 5, page: 2, sort: [{key: 'foo' as const, direction: 'asc' as const}]},
            {skip: 5, take: 5, orderBy: [{foo: 'asc'}]},
        ],
    ])('should normalize pagination', (pagination, expected) => {
        expect(repository.paginate(pagination)).toEqual(expected);
    });

    it('should provide the soft-delete data', () => {
        const now = new Date('2024-01-01T00:00:00Z');

        jest.useFakeTimers({now});

        expect(repository.softDeleteData()).toEqual({deletedAt: now, updatedAt: now});
    });

    it('should check if the error is a Prisma violation', () => {
        const error = new Prisma.PrismaClientKnownRequestError('message', {
            code: 'P1000',
            clientVersion: '0.0.0',
        });

        expect(repository.isPrismaViolation(error)).toBe(true);
        expect(repository.isPrismaViolation(new Error('message'))).toBe(false);
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
        [{code: 'P2002', meta: {target: ['target']}}, true],
        [{code: 'P2002', meta: {target: ['other-target']}}, false],
        [{code: 'P2002', meta: {target: 'target'}}, false],
        [{code: 'P2003', meta: {target: ['target']}}, false],
        [{code: 'P2003'}, false],
    ])('should check if the error is a unique constraint violation for a specific target', (errorParams, expected) => {
        const error = new Prisma.PrismaClientKnownRequestError('message', {
            ...errorParams,
            clientVersion: '0.0.0',
        });

        expect(repository.checkUniqueViolation(error, 'target')).toBe(expected);
    });

    it.each([
        [{code: 'P2003', meta: {constraint: 'target'}}, 'target', true],
        [{code: 'P2003', meta: {constraint: 'other-target'}}, 'target', false],
        [{code: 'P2003', meta: {constraint: 'other-target'}}, undefined, true],
        [{code: 'P2003', meta: {field_name: 'target (index)'}}, 'target', false],
        [{code: 'P2003'}, undefined, false],
        [{code: 'P2002', meta: {constraint: 'target'}}, 'target', false],
    ])(
        'should check if the error is a foreign key constraint violation for a specific target',
        (errorParams, target, expected) => {
            const error = new Prisma.PrismaClientKnownRequestError('message', {
                ...errorParams,
                clientVersion: '0.0.0',
            });

            expect(repository.checkForeignKeyViolation(error, target)).toBe(expected);
        }
    );
});
