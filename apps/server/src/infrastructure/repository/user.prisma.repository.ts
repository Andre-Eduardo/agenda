import {Injectable} from '@nestjs/common';
import {Prisma} from '@prisma/client';
import {Email} from '../../domain/@shared/value-objects';
import {GlobalRole} from '../../domain/auth';
import {PersonId} from '../../domain/person/entities';
import {ProfessionalId} from '../../domain/professional/entities';
import {User, UserId} from '../../domain/user/entities';
import {DuplicateEmailException, DuplicateUsernameException} from '../../domain/user/user.exceptions';
import {UserRepository} from '../../domain/user/user.repository';
import {ObfuscatedPassword, Username} from '../../domain/user/value-objects';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

const userSelect = Prisma.validator<Prisma.UserDefaultArgs>()({
    include: {
        professionals: true,
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
            professionals: user.professionals.map((professional) => ProfessionalId.from(professional.id)),
            name: user.name,
            globalRole: GlobalRole[user.globalRole],
        });
    }

    private static denormalize(user: User): Omit<UserModel, 'professionals'> & {professionals: Array<{id: string}>} {
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
            professionals: user.professionals.map((professionalId) => ({id: professionalId.toString()})),
        };
    }

    async findById(id: UserId): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: {
                id: id.toString(),
            },
            ...userSelect,
        });

        return user === null ? null : UserPrismaRepository.normalize(user);
    }

    async findByUsername(username: Username): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: {
                username: username.toString(),
            },
            ...userSelect,
        });

        return user === null ? null : UserPrismaRepository.normalize(user);
    }

    async findByEmail(email: Email): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: {
                email: email.toString(),
            },
            ...userSelect,
        });

        return user === null ? null : UserPrismaRepository.normalize(user);
    }

    async findByEmployeeId(employeeId: PersonId): Promise<User | null> {
        const user = await this.prisma.user.findFirst({
            where: {
                professionals: {
                    some: {
                        personId: employeeId.toString(),
                    },
                },
            },
            ...userSelect,
        });

        return user === null ? null : UserPrismaRepository.normalize(user);
    }

    async save(user: User): Promise<void> {
        const {professionals, ...userModel} = UserPrismaRepository.denormalize(user);
        const professionalIds = user.professionals.map((id) => ({id: id.toString()}));

        try {
            await this.prisma.user.upsert({
                where: {
                    id: userModel.id,
                },
                create: {
                    ...userModel,
                    professionals: {
                        connect: professionalIds,
                    },
                },
                update: {
                    ...userModel,
                    professionals: {
                        set: professionalIds,
                    },
                },
            });
        } catch (e) {
            if (this.checkUniqueViolation(e, 'username')) {
                throw new DuplicateUsernameException('Duplicate username.');
            }

            if (this.checkUniqueViolation(e, 'email')) {
                throw new DuplicateEmailException('Duplicate user email.');
            }

            throw e;
        }
    }

    async search(
        _pagination: any,
        _filter?: any
    ): Promise<any> {
        throw new Error('Method not implemented.');
    }

    async delete(id: UserId): Promise<void> {
        await this.prisma.user.delete({
            where: {
                id: id.toString(),
            },
        });
    }
}
