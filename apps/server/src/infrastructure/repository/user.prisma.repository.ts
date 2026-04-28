import {Injectable} from '@nestjs/common';
import {Prisma} from '@prisma/client';
import {Email} from '../../domain/@shared/value-objects';
import {GlobalRole} from '../../domain/auth';
import {ClinicMemberId} from '../../domain/clinic-member/entities';
import {User, UserId} from '../../domain/user/entities';
import {DuplicateEmailException, DuplicateUsernameException} from '../../domain/user/user.exceptions';
import {UserRepository, UserSearchFilter, UserSortOptions} from '../../domain/user/user.repository';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {ObfuscatedPassword, Username} from '../../domain/user/value-objects';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

const userSelect = Prisma.validator<Prisma.UserDefaultArgs>()({
    include: {
        members: true,
    },
});

export type UserModel = Prisma.UserGetPayload<typeof userSelect>;

@Injectable()
export class UserPrismaRepository extends PrismaRepository implements UserRepository {
    constructor(readonly prismaProvider: PrismaProvider) {
        super(prismaProvider);
    }

    private static normalize(user: UserModel): User {
        return new User({
            ...user,
            id: UserId.from(user.id),
            username: Username.create(user.username),
            email: user.email === null ? null : Email.create(user.email),
            password: ObfuscatedPassword.decode(user.password),
            clinicMembers: user.members.map((member) => ClinicMemberId.from(member.id)),
            name: user.name,
            globalRole: GlobalRole[user.globalRole],
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            deletedAt: user.deletedAt,
        });
    }

    private static denormalize(user: User): Omit<UserModel, 'members'> {
        return {
            id: user.id.toString(),
            username: user.username.toString(),
            email: user.email?.toString() ?? null,
            password: user.password.encode(),
            name: user.name,
            phone: null,
            globalRole: user.globalRole,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            deletedAt: user.deletedAt ?? null,
        };
    }

    async findById(id: UserId): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: {id: id.toString()},
            ...userSelect,
        });

        return user === null ? null : UserPrismaRepository.normalize(user);
    }

    async findByUsername(username: Username): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: {username: username.toString()},
            ...userSelect,
        });

        return user === null ? null : UserPrismaRepository.normalize(user);
    }

    async findByEmail(email: Email): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: {email: email.toString()},
            ...userSelect,
        });

        return user === null ? null : UserPrismaRepository.normalize(user);
    }

    async save(user: User): Promise<void> {
        const userModel = UserPrismaRepository.denormalize(user);

        try {
            await this.prisma.user.upsert({
                where: {id: userModel.id},
                create: userModel,
                update: userModel,
            });
        } catch (error) {
            if (this.checkUniqueViolation(error, 'username')) {
                throw new DuplicateUsernameException('Duplicate username.');
            }

            if (this.checkUniqueViolation(error, 'email')) {
                throw new DuplicateEmailException('Duplicate user email.');
            }

            throw error;
        }
    }

    async search(
        pagination: Pagination<UserSortOptions>,
        filter: UserSearchFilter = {},
    ): Promise<PaginatedList<User>> {
        const where: Prisma.UserWhereInput = {
            id: filter.ids ? {in: filter.ids.map((id) => id.toString())} : undefined,
            OR: filter.term
                ? [
                      {name: {contains: filter.term, mode: 'insensitive'}},
                      {username: {contains: filter.term, mode: 'insensitive'}},
                      {email: {contains: filter.term, mode: 'insensitive'}},
                  ]
                : undefined,
        };

        const [data, totalCount] = await Promise.all([
            this.prisma.user.findMany({
                where,
                ...userSelect,
                ...this.normalizePagination(pagination, {createdAt: 'desc'}),
            }),
            this.prisma.user.count({where}),
        ]);

        return {
            data: data.map((item) => UserPrismaRepository.normalize(item)),
            totalCount,
        };
    }

    async delete(id: UserId): Promise<void> {
        await this.prisma.user.delete({where: {id: id.toString()}});
    }
}
