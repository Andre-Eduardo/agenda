import {Prisma} from '@prisma/client';
import type {Sort} from '../../domain/@shared/repository';
import type {PrismaViolation} from './prisma';
import {FOREIGN_KEY_CONSTRAINT_VIOLATION, UNIQUE_CONSTRAINT_VIOLATION} from './prisma';

export abstract class PrismaRepository {
    protected normalizeSort<T extends Sort<string[]>, E extends Record<string, Prisma.SortOrder>>(
        sort?: T,
        extraSort?: E
    ): Array<T | E> {
        return [
            ...(Object.entries(sort ?? {}).map(([field, order]) => ({
                [field]: order,
            })) as T[]),
            ...(extraSort ? [extraSort] : []),
        ];
    }

    protected isUniqueConstraintViolation(
        error: unknown
    ): error is PrismaViolation<typeof UNIQUE_CONSTRAINT_VIOLATION> {
        return this.isPrismaViolation(error) && error.code === UNIQUE_CONSTRAINT_VIOLATION;
    }

    protected isForeignKeyConstraintViolation(
        error: unknown
    ): error is PrismaViolation<typeof FOREIGN_KEY_CONSTRAINT_VIOLATION> {
        return this.isPrismaViolation(error) && error.code === FOREIGN_KEY_CONSTRAINT_VIOLATION;
    }

    protected checkUniqueViolation(error: unknown, ...target: string[]): boolean {
        if (!this.isUniqueConstraintViolation(error)) {
            return false;
        }

        if (!error.meta?.target || !Array.isArray(error.meta.target)) {
            return false;
        }

        for (const t of target) {
            if (!error.meta.target.includes(t)) {
                return false;
            }
        }

        return true;
    }

    protected checkForeignKeyViolation(error: unknown, ...target: string[]): boolean {
        if (!this.isForeignKeyConstraintViolation(error)) {
            return false;
        }

        if (!error.meta?.field_name) {
            return false;
        }

        return error.meta?.field_name === `${target} (index)`;
    }

    protected isPrismaViolation(error: unknown): error is Prisma.PrismaClientKnownRequestError {
        return error instanceof Prisma.PrismaClientKnownRequestError;
    }
}
