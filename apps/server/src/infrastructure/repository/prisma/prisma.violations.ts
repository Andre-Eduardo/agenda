import type {Prisma} from '@prisma/client';

export const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';
export const FOREIGN_KEY_CONSTRAINT_VIOLATION = 'P2003';

export type PrismaViolation<C> = Prisma.PrismaClientKnownRequestError & {code: C};
