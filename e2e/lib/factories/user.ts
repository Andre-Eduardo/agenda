import {randomBytes} from 'node:crypto';
import {uuidv7} from 'uuidv7';
import {hashPassword} from '../auth';
import {prisma} from './prisma';

export type GlobalRole = 'SUPER_ADMIN' | 'OWNER' | 'NONE';

export type CreateUserEntry = {
    username?: string;
    email?: string;
    name?: string;
    password?: string;
    phone?: string;
    globalRole?: GlobalRole;
};

export type CreatedUser = {
    id: string;
    username: string;
    email: string | null;
    name: string;
    password: string;
    globalRole: GlobalRole;
};

export async function createTestUsers(entries: CreateUserEntry[]): Promise<CreatedUser[]> {
    const users: CreatedUser[] = [];
    for (const entry of entries) {
        users.push(await createTestUser(entry));
    }
    return users;
}

export async function createTestUser(entry: CreateUserEntry = {}): Promise<CreatedUser> {
    const suffix = randomBytes(4).toString('hex');
    const username = entry.username ?? `test-user-${suffix}`;
    const password = entry.password ?? 'Passw0rd!Test';
    const hashedPassword = await hashPassword(password);
    const now = new Date();

    const user = await prisma.user.create({
        data: {
            id: uuidv7(),
            username,
            email: entry.email ?? `test-${suffix}@example.com`,
            name: entry.name ?? 'Test User',
            password: hashedPassword,
            phone: entry.phone ?? null,
            globalRole: entry.globalRole ?? 'NONE',
            createdAt: now,
            updatedAt: now,
        },
    });

    return {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        password,
        globalRole: user.globalRole,
    };
}
