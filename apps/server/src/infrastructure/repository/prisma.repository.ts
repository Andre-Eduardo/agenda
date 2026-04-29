import { Prisma } from "@prisma/client";
import type { Pagination } from "@domain/@shared/repository";
import type { PrismaProvider } from "@infrastructure/repository/prisma/prisma.provider";
import type { PrismaService } from "@infrastructure/repository/prisma/prisma.service";
import type { PrismaViolation } from "@infrastructure/repository/prisma/prisma.violations";
import {
  FOREIGN_KEY_CONSTRAINT_VIOLATION,
  UNIQUE_CONSTRAINT_VIOLATION,
} from "@infrastructure/repository/prisma/prisma.violations";

export type OrderBy = {
  [key: string]: Prisma.SortOrder | OrderBy;
};

type PrismaPagination = {
  skip?: number;
  take: number;
  orderBy?: OrderBy[];
};

export abstract class PrismaRepository {
  constructor(protected readonly prismaProvider: PrismaProvider) {}

  protected get prisma(): PrismaService {
    return this.prismaProvider.client;
  }

  protected normalizeSort<
    O extends string[],
    T extends { key: O[number]; direction: Prisma.SortOrder },
    E extends Record<string, Prisma.SortOrder>,
  >(sort?: T[], extraSort?: E): OrderBy[] {
    const normalizedSort: OrderBy[] = (sort ?? []).map(({ key, direction }) => {
      const keys = key.split(".");

      return keys
        .toReversed()
        .reduce<OrderBy>(
          (acc, curr, idx) => (idx === 0 ? { [curr]: direction } : { [curr]: acc }),
          {},
        );
    });

    if (extraSort) {
      for (const [key, direction] of Object.entries(extraSort)) {
        normalizedSort.push({ [key]: direction });
      }
    }

    return normalizedSort;
  }

  protected normalizePagination<O extends string[], E extends Record<string, Prisma.SortOrder>>(
    { limit, page, sort }: Pagination<O>,
    extraSort?: E,
  ): PrismaPagination {
    return {
      skip: page && page > 1 ? limit * (page - 1) : undefined,
      take: limit,
      orderBy: this.normalizeSort(sort, extraSort),
    };
  }

  protected isUniqueConstraintViolation(
    error: unknown,
  ): error is PrismaViolation<typeof UNIQUE_CONSTRAINT_VIOLATION> {
    return this.isPrismaViolation(error) && error.code === UNIQUE_CONSTRAINT_VIOLATION;
  }

  protected isForeignKeyConstraintViolation(
    error: unknown,
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

  protected checkForeignKeyViolation(error: unknown, target?: string): boolean {
    if (!this.isForeignKeyConstraintViolation(error)) {
      return false;
    }

    if (!error.meta?.constraint) {
      return false;
    }

    if (!target) {
      return true;
    }

    return error.meta?.constraint === target;
  }

  protected isPrismaViolation(error: unknown): error is Prisma.PrismaClientKnownRequestError {
    return error instanceof Prisma.PrismaClientKnownRequestError;
  }
}
