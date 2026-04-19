import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient({
    datasourceUrl:
        process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/agenda',
});

export function getPrismaClient() {
    return prisma;
}

export {prisma};
