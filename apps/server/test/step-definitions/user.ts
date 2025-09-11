import {randomInt} from 'crypto';
import type {DataTable} from '@cucumber/cucumber';
import {Given, Then} from '@cucumber/cucumber';
import * as chai from 'chai';
import {Email} from '../../src/domain/@shared/value-objects';
import {GlobalRole} from '../../src/domain/auth';
import {User, UserId} from '../../src/domain/user/entities';
import {UserRepository} from '../../src/domain/user/user.repository';
import {ObfuscatedPassword, Username} from '../../src/domain/user/value-objects';
import type {Context} from '../support/context';
import {multipleEntries} from '../support/data-table-converters';

type UserEntry = {
    username?: string;
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    globalRole?: keyof typeof GlobalRole;
    companies?: string[];
    createdAt?: string;
    updatedAt?: string;
};

const userHeaderMap: Record<string, keyof UserEntry> = {
    Username: 'username',
    Email: 'email',
    Password: 'password',
    'First name': 'firstName',
    'Last name': 'lastName',
    'Global role': 'globalRole',
    Companies: 'companies',
    'Created at': 'createdAt',
    'Updated at': 'updatedAt',
};

const passwords: Record<string, string> = {};

Given('the following users exist:', async function (this: Context, table: DataTable) {
    const users = multipleEntries<UserEntry>(this, table, userHeaderMap);

    for (const entry of users) {
        await createUser(this, entry.username ?? `randomUser-${randomInt(1000)}`, entry);
    }
});

export async function createUser(context: Context, username: string, entry: UserEntry): Promise<User> {
    const password = entry.password ?? `${username}Pa$$w0rd`;

    const user = new User({
        id: UserId.generate(),
        username: Username.create(username),
        email: Email.create(entry.email ?? `${username}@example.com`),
        password: await ObfuscatedPassword.obfuscate(password),
        firstName: entry.firstName ?? username,
        lastName: entry.lastName ?? null,
        globalRole: GlobalRole[entry.globalRole ?? 'NONE'],
        companies: entry.companies?.map((companyId) => context.variables.ids.company[companyId]) ?? [],
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
    });

    passwords[username] = password;

    await repository(context).save(user);

    context.setVariableId('user', username, user.id);

    return user;
}

Given('I am signed in as {string}', async function (this: Context, username: string) {
    this.clearAgent();

    chai.expect(passwords[username], `No password found for the user ${username}`).to.exist;

    const response = await this.agent.post('/auth/sign-in').send({
        username,
        password: passwords[username],
    });

    chai.expect(response.error, 'An error occurred while signing in').to.be.false;
});

Given(
    'I am signed in as {string} in the company {string}',
    async function (this: Context, username: string, company: string) {
        this.clearAgent();

        chai.expect(passwords[username], `No password found for the user ${username}`).to.exist;

        chai.expect(this.variables.ids.company[company], `No company found with the name ${company}`).to.exist;

        const response = await this.agent.post('/auth/sign-in').send({
            companyId: this.variables.ids.company[company].toString(),
            username,
            password: passwords[username],
        });

        chai.expect(response.error, 'An error occurred while signing in').to.be.false;
    }
);

Then('I should be signed in as {string}', async function (this: Context, username: string) {
    const signedUsername = await getSignedInUsername(this);

    chai.expect(signedUsername).to.equal(username);
});

Then('I should be signed out', async function (this: Context) {
    const signedUsername = await getSignedInUsername(this);

    chai.expect(signedUsername).to.be.null;
});

async function getSignedInUsername(context: Context): Promise<string | null> {
    const response = await context.agent.get('/user/me').send();

    if (response.error) {
        return null;
    }

    return response.body.username;
}

Then('my authentication should be remembered for {int} day(s)', function (this: Context, days: number) {
    const cookie = this.agent.jar.getCookie('session.token', {
        path: '/',
        domain: '127.0.0.1',
        secure: true,
        script: false,
    });

    chai.expect(cookie).to.exist;

    const targetExpiration = Date.now() + days * 24 * 3600 * 1000;

    chai.expect(cookie!.expiration_date).to.be.approximately(targetExpiration, 10000);
});

Then('should exist users with the following data:', async function (this: Context, table: DataTable) {
    const users = multipleEntries<UserEntry>(this, table, userHeaderMap);

    const existingUsers = await this.prisma.user.findMany({
        where: {
            OR: users.map((entry) => ({
                username: entry.username,
                email: entry.email,
                firstName: entry.firstName,
                lastName: entry.lastName,
                globalRole: entry.globalRole,
                companies: {
                    every: {
                        companyId: {
                            in: entry.companies?.map((companyId) => this.variables.ids.company[companyId].toString()),
                        },
                    },
                },
                createdAt: entry.createdAt,
                updatedAt: entry.updatedAt,
            })),
        },
    });

    chai.expect(existingUsers).to.have.lengthOf(
        users.length,
        'The number of users found does not match the expected number'
    );
});

Then('the following users should exist:', async function (this: Context, table: DataTable) {
    const users = multipleEntries<UserEntry>(this, table, userHeaderMap);

    const existingUsersCount = await this.prisma.user.count();
    const foundUsers = await this.prisma.user.findMany({
        where: {
            OR: users.map((entry) => ({
                username: entry.username,
                email: entry.email,
                firstName: entry.firstName,
                lastName: entry.lastName,
                globalRole: entry.globalRole,
                companies: {
                    every: {
                        companyId: {
                            in: entry.companies?.map((companyId) => this.variables.ids.company[companyId].toString()),
                        },
                    },
                },
                createdAt: entry.createdAt,
                updatedAt: entry.updatedAt,
            })),
        },
    });

    chai.expect(foundUsers).to.have.lengthOf(
        users.length,
        'The number of found users does not match the expected number'
    );

    chai.expect(foundUsers).to.have.lengthOf(
        existingUsersCount,
        'The number of found users does not match the number of existing users'
    );
});

Then(
    'the following users should not exist in the company {string}:',
    async function (this: Context, company: string, table: DataTable) {
        const users = multipleEntries<UserEntry>(this, table, userHeaderMap);

        const existingUsers = await this.prisma.user.findMany({
            where: {
                OR: users.map((entry) => ({
                    username: entry.username,
                    email: entry.email,
                    firstName: entry.firstName,
                    lastName: entry.lastName,
                    globalRole: entry.globalRole,
                    companies: {
                        some: {
                            companyId: {
                                equals: this.variables.ids.company[company].toString(),
                            },
                        },
                    },
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt,
                })),
            },
        });

        chai.expect(existingUsers).to.have.lengthOf(0, 'Users found in the company');
    }
);

Then('no user with username {string} should exist', async function (this: Context, username: string) {
    const users = await this.prisma.user.findUnique({
        where: {
            username,
        },
    });

    chai.expect(users, `A user found with the username ${username}`).to.be.null;
});

Then('the password of user {string} is {string}', async function (this: Context, username: string, password: string) {
    const user = await this.app.get(UserRepository).findByUsername(Username.create(username));

    chai.expect(user, `No user found with the username ${username}`).not.to.be.null;

    const isPasswordValid = await user!.password.verify(password);

    chai.expect(isPasswordValid, 'The password does not match').to.be.true;
});

function repository(context: Context) {
    return context.app.get(UserRepository);
}
