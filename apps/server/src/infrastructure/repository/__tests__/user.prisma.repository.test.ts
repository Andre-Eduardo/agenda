import {Prisma} from '@prisma/client';
import {mockDeep} from 'jest-mock-extended';
import type {Pagination} from '@domain/@shared/repository';
import {Email} from '@domain/@shared/value-objects';
import {GlobalRole} from '@domain/auth';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {User, UserId} from '@domain/user/entities';
import {DuplicateEmailException, DuplicateUsernameException} from '@domain/user/user.exceptions';
import type {UserSortOptions} from '@domain/user/user.repository';
import {ObfuscatedPassword, Username} from '@domain/user/value-objects';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';
import {PrismaService} from '@infrastructure/repository/prisma/prisma.service';
import type {UserModel} from '@infrastructure/repository/user.prisma.repository';
import {UserPrismaRepository} from '@infrastructure/repository/user.prisma.repository';

// Pa$$w0rd
const encodedPassword =
    '64:yLmVvBhiYeIjxe+e+IU7hg==:wYTiKiL5dKb14d44RXDpop7cqcZrlC/zRe53tATkENSG+lH0Tsq43Bw2TVx2BtCCx2oAHK8eM5Uf9nWoAw9yeg==';

describe('A user repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const prismaProvider = mockDeep<PrismaProvider>();

    Object.defineProperty(prismaProvider, 'client', {get: () => prisma});

    const repository = new UserPrismaRepository(prismaProvider);

    const domainUsers: User[] = [
        new User({
            id: UserId.generate(),
            username: Username.create('john_doe'),
            email: Email.create('john_doe@example.com'),
            password: ObfuscatedPassword.decode(encodedPassword),
            name: 'John Doe',
            globalRole: GlobalRole.NONE,
            clinicMembers: [ClinicMemberId.generate()],
            createdAt: new Date(1000),
            updatedAt: new Date(1000),
            deletedAt: null,
        }),
        new User({
            id: UserId.generate(),
            username: Username.create('jakob_nunez'),
            email: null,
            password: ObfuscatedPassword.decode(encodedPassword),
            name: 'Jakob Nunez',
            globalRole: GlobalRole.OWNER,
            clinicMembers: [],
            createdAt: new Date(2000),
            updatedAt: new Date(2000),
            deletedAt: null,
        }),
    ];

    const toUserModel = (user: User): UserModel => ({
        id: user.id.toString(),
        username: user.username.toString(),
        email: user.email?.toString() ?? null,
        password: encodedPassword,
        name: user.name,
        phone: null,
        globalRole: user.globalRole,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deletedAt: null,
        members: user.clinicMembers.map((clinicMemberId) => ({
            id: clinicMemberId.toString(),
            clinicId: ClinicId.generate().toString(),
            userId: user.id.toString(),
            roles: [],
            displayName: null,
            color: null,
            isActive: true,
            invitedByMemberId: null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            deletedAt: null,
        })),
    });

    const databaseUsers: UserModel[] = domainUsers.map(toUserModel);

    const include = {members: {where: {deletedAt: null}}};

    afterEach(() => {
        jest.useRealTimers();
    });

    it.each([
        [null, null],
        [databaseUsers[0], domainUsers[0]],
    ])('should find a user by ID', async (databaseUser, domainUser) => {
        prisma.user.findUnique.mockResolvedValueOnce(databaseUser);

        await expect(repository.findById(domainUsers[0].id)).resolves.toEqual(domainUser);

        expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: {id: domainUsers[0].id.toString(), deletedAt: null},
            include,
        });
    });

    it.each([
        [null, null],
        [databaseUsers[0], domainUsers[0]],
    ])('should find a user by username', async (databaseUser, domainUser) => {
        prisma.user.findUnique.mockResolvedValueOnce(databaseUser);

        await expect(repository.findByUsername(domainUsers[0].username)).resolves.toEqual(domainUser);

        expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: {username: domainUsers[0].username.toString(), deletedAt: null},
            include,
        });
    });

    it.each([
        [null, null],
        [databaseUsers[0], domainUsers[0]],
    ])('should find a user by email', async (databaseUser, domainUser) => {
        const email = Email.create('john_doe@example.com');

        prisma.user.findUnique.mockResolvedValueOnce(databaseUser);

        await expect(repository.findByEmail(email)).resolves.toEqual(domainUser);

        expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: {email: email.toString(), deletedAt: null},
            include,
        });
    });

    it.each([
        [databaseUsers[0], domainUsers[0]],
        [databaseUsers[1], domainUsers[1]],
    ])('should save a user', async (databaseUser, domainUser) => {
        const {members: _members, ...userModel} = databaseUser;

        await repository.save(domainUser);

        expect(prisma.user.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.user.upsert).toHaveBeenCalledWith({
            where: {id: domainUser.id.toString()},
            create: userModel,
            update: userModel,
        });
    });

    it('should throw an exception when saving a user with a duplicate username', async () => {
        prisma.user.upsert.mockRejectedValueOnce(
            new Prisma.PrismaClientKnownRequestError('Unique constraint violation', {
                clientVersion: '0.0.0',
                code: 'P2002',
                meta: {target: ['username']},
            })
        );

        await expect(repository.save(domainUsers[1])).rejects.toThrowWithMessage(
            DuplicateUsernameException,
            'Duplicate username.'
        );
    });

    it('should throw an exception when saving a user with a duplicate email', async () => {
        prisma.user.upsert.mockRejectedValueOnce(
            new Prisma.PrismaClientKnownRequestError('Unique constraint violation', {
                clientVersion: '0.0.0',
                code: 'P2002',
                meta: {target: ['email']},
            })
        );

        await expect(repository.save(domainUsers[1])).rejects.toThrowWithMessage(
            DuplicateEmailException,
            'Duplicate user email.'
        );
    });

    it('should rethrow an unknown error when saving a user', async () => {
        const error = new Error('Unknown error');

        prisma.user.upsert.mockRejectedValueOnce(error);

        await expect(repository.save(domainUsers[1])).rejects.toThrow(error);
    });

    it.each([
        [{}, {id: undefined, OR: undefined, deletedAt: null}],
        [
            {ids: [domainUsers[0].id], term: 'john'},
            {
                id: {in: [domainUsers[0].id.toString()]},
                OR: [
                    {name: {contains: 'john', mode: 'insensitive'}},
                    {username: {contains: 'john', mode: 'insensitive'}},
                    {email: {contains: 'john', mode: 'insensitive'}},
                ],
                deletedAt: null,
            },
        ],
    ])('should search users', async (filter, where) => {
        const pagination: Pagination<UserSortOptions> = {limit: 10};

        prisma.user.findMany.mockResolvedValueOnce(databaseUsers);
        prisma.user.count.mockResolvedValueOnce(databaseUsers.length);

        await expect(repository.search(pagination, filter)).resolves.toEqual({
            data: domainUsers,
            totalCount: databaseUsers.length,
        });

        expect(prisma.user.findMany).toHaveBeenCalledWith({
            where,
            include,
            skip: undefined,
            take: 10,
            orderBy: [{createdAt: 'desc'}],
        });
        expect(prisma.user.count).toHaveBeenCalledWith({where});
    });

    it('should soft-delete a user by ID', async () => {
        const now = new Date('2024-01-01T00:00:00Z');

        jest.useFakeTimers({now});

        await repository.delete(domainUsers[0].id);

        expect(prisma.user.updateMany).toHaveBeenCalledTimes(1);
        expect(prisma.user.updateMany).toHaveBeenCalledWith({
            where: {id: domainUsers[0].id.toString(), deletedAt: null},
            data: {deletedAt: now, updatedAt: now},
        });
    });
});
