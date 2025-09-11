import {Prisma} from '@prisma/client';
import {mockDeep} from 'jest-mock-extended';
import {Email} from '../../../domain/@shared/value-objects';
import {GlobalRole} from '../../../domain/auth';
import {PersonId} from '../../../domain/person/entities';
import type {User} from '../../../domain/user/entities';
import {fakeUser} from '../../../domain/user/entities/__tests__/fake-user';
import {DuplicateEmailException, DuplicateUsernameException} from '../../../domain/user/user.exceptions';
import {ObfuscatedPassword, Username} from '../../../domain/user/value-objects';
import type {UserModel} from '../index';
import {UserPrismaRepository} from '../index';
import type {PrismaService} from '../prisma';

// Pa$$w0rd
const encodedPassword =
    '64:yLmVvBhiYeIjxe+e+IU7hg==:wYTiKiL5dKb14d44RXDpop7cqcZrlC/zRe53tATkENSG+lH0Tsq43Bw2TVx2BtCCx2oAHK8eM5Uf9nWoAw9yeg==';

describe('A user repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new UserPrismaRepository(prisma);

    const domainUsers: User[] = [
        fakeUser({
            username: Username.create('john_doe'),
            email: Email.create('john_doe@example.com'),
            password: ObfuscatedPassword.decode(encodedPassword),
            firstName: 'John',
            lastName: 'Doe',
            globalRole: GlobalRole.NONE,
        }),
        fakeUser({
            username: Username.create('john_doe'),
            email: null,
            password: ObfuscatedPassword.decode(encodedPassword),
            firstName: 'Jakob',
            lastName: 'Nunez',
            globalRole: GlobalRole.NONE,
        }),
    ];

    const databaseUsers: UserModel[] = [
        {
            id: domainUsers[0].id.toString(),
            username: domainUsers[0].username.toString(),
            email: domainUsers[0].email?.toString() ?? null,
            password: encodedPassword,
            firstName: domainUsers[0].firstName,
            lastName: domainUsers[0].lastName,
            globalRole: domainUsers[0].globalRole,
            companies: domainUsers[0].companies.map((companyId) => ({
                companyId: companyId.toString(),
                userId: domainUsers[0].id.toString(),
            })),
            createdAt: domainUsers[0].createdAt,
            updatedAt: domainUsers[0].updatedAt,
        },
        {
            id: domainUsers[1].id.toString(),
            username: domainUsers[1].username.toString(),
            email: domainUsers[1].email?.toString() ?? null,
            password: encodedPassword,
            firstName: domainUsers[1].firstName,
            lastName: domainUsers[1].lastName,
            globalRole: domainUsers[1].globalRole,
            companies: domainUsers[1].companies.map((companyId) => ({
                companyId: companyId.toString(),
                userId: domainUsers[1].id.toString(),
            })),
            createdAt: domainUsers[1].createdAt,
            updatedAt: domainUsers[1].updatedAt,
        },
    ];

    it.each([
        [null, null],
        [databaseUsers[0], domainUsers[0]],
    ])('should find a user by ID', async (databaseUser, domainUser) => {
        jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(databaseUser);

        await expect(repository.findById(domainUsers[0].id)).resolves.toEqual(domainUser);

        expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainUsers[0].id.toString(),
            },
            include: {
                companies: true,
            },
        });
    });

    it.each([
        [null, null],
        [databaseUsers[0], domainUsers[0]],
    ])('should find a user by username', async (databaseUser, domainUser) => {
        jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(databaseUser);

        await expect(repository.findByUsername(domainUsers[0].username)).resolves.toEqual(domainUser);

        expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: {
                username: domainUsers[0].username.toString(),
            },
            include: {
                companies: true,
            },
        });
    });

    it.each([
        [null, null],
        [databaseUsers[0], domainUsers[0]],
    ])('should find a user by email', async (databaseUser, domainUser) => {
        jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(databaseUser);

        await expect(repository.findByEmail(domainUsers[0].email!)).resolves.toEqual(domainUser);

        expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: {
                email: domainUsers[0].email!.toString(),
            },
            include: {
                companies: true,
            },
        });
    });

    it.each([
        [null, null],
        [databaseUsers[1], domainUsers[1]],
    ])('should find a user by the employee ID', async (databaseUser, domainUser) => {
        const employeeId = PersonId.generate();

        jest.spyOn(prisma.user, 'findFirst').mockResolvedValueOnce(databaseUser);

        await expect(repository.findByEmployeeId(employeeId)).resolves.toEqual(domainUser);

        expect(prisma.user.findFirst).toHaveBeenCalledTimes(1);
        expect(prisma.user.findFirst).toHaveBeenCalledWith({
            where: {
                employees: {
                    some: {
                        id: employeeId.toString(),
                    },
                },
            },
            include: {
                companies: true,
            },
        });
    });

    it.each([
        [databaseUsers[0], domainUsers[0]],
        [databaseUsers[1], domainUsers[1]],
    ])('should save a user', async (databaseUser, domainUser) => {
        const {companies, ...userModel} = databaseUser;
        const companyModels = companies.map((company) => ({companyId: company.companyId}));

        jest.spyOn(prisma.user, 'upsert');

        await repository.save(domainUser);

        expect(prisma.user.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.user.upsert).toHaveBeenCalledWith({
            where: {
                id: domainUser.id.toString(),
            },
            create: {
                ...userModel,
                companies: {
                    createMany: {
                        data: companyModels,
                    },
                },
            },
            update: {
                ...userModel,
                companies: {
                    deleteMany: {
                        userId: userModel.id,
                        NOT: companyModels,
                    },
                    createMany: {
                        data: companyModels,
                        skipDuplicates: true,
                    },
                },
            },
        });
    });

    it('should throw an exception when saving a user with a duplicate username', async () => {
        jest.spyOn(prisma.user, 'upsert').mockRejectedValueOnce(
            new Prisma.PrismaClientKnownRequestError('Unique constraint violation', {
                clientVersion: '0.0.0',
                code: 'P2002',
                meta: {
                    target: ['username'],
                },
            })
        );

        await expect(repository.save(domainUsers[1])).rejects.toThrowWithMessage(
            DuplicateUsernameException,
            'Duplicate username.'
        );
    });

    it('should throw an exception when saving a user with a duplicate email', async () => {
        jest.spyOn(prisma.user, 'upsert').mockRejectedValueOnce(
            new Prisma.PrismaClientKnownRequestError('Unique constraint violation', {
                clientVersion: '0.0.0',
                code: 'P2002',
                meta: {
                    target: ['email'],
                },
            })
        );

        await expect(repository.save(domainUsers[1])).rejects.toThrowWithMessage(
            DuplicateEmailException,
            'Duplicate user email.'
        );
    });

    it('should rethrow an unknown error when saving a user', async () => {
        const error = new Error('Unknown error');

        jest.spyOn(prisma.user, 'upsert').mockRejectedValueOnce(error);

        await expect(repository.save(domainUsers[1])).rejects.toThrow(error);
    });

    it('should delete a user by ID', async () => {
        jest.spyOn(prisma.user, 'delete');

        await repository.delete(domainUsers[0].id);

        expect(prisma.user.delete).toHaveBeenCalledTimes(1);
        expect(prisma.user.delete).toHaveBeenCalledWith({
            where: {
                id: domainUsers[0].id.toString(),
            },
        });
    });
});
