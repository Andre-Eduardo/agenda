import {Injectable} from '@nestjs/common';
import {Prisma} from '@prisma/client';
import {Email} from '../../domain/@shared/value-objects';
import {GlobalRole} from '../../domain/auth';
import {CompanyId} from '../../domain/company/entities';
import {PersonId} from '../../domain/person/entities';
import {User, UserId} from '../../domain/user/entities';
import {DuplicateEmailException, DuplicateUsernameException} from '../../domain/user/user.exceptions';
import {UserRepository} from '../../domain/user/user.repository';
import {ObfuscatedPassword, Username} from '../../domain/user/value-objects';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

const userSelect = Prisma.validator<Prisma.UserDefaultArgs>()({
    include: {
        companies: true,
    },
});

export type UserModel = Prisma.UserGetPayload<typeof userSelect>;

@Injectable()
export class UserPrismaRepository extends PrismaRepository implements UserRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(user: UserModel): User {
        return new User({
            ...user,
            id: UserId.from(user.id),
            username: Username.create(user.username),
            email: user.email === null ? null : Email.create(user.email),
            password: ObfuscatedPassword.decode(user.password),
            globalRole: GlobalRole[user.globalRole],
            companies: user.companies.map((company) => CompanyId.from(company.companyId)),
        });
    }

    private static denormalize(user: User): UserModel {
        return {
            id: user.id.toString(),
            username: user.username.toString(),
            email: user.email?.toString() ?? null,
            password: user.password.encode(),
            firstName: user.firstName,
            lastName: user.lastName,
            globalRole: user.globalRole,
            companies: user.companies.map((companyId) => ({
                companyId: companyId.toString(),
                userId: user.id.toString(),
            })),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
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
                employees: {
                    some: {
                        id: employeeId.toString(),
                    },
                },
            },
            ...userSelect,
        });

        return user === null ? null : UserPrismaRepository.normalize(user);
    }

    async save(user: User): Promise<void> {
        const {companies, ...userModel} = UserPrismaRepository.denormalize(user);
        const companyModels = companies.map((company) => ({companyId: company.companyId}));

        try {
            await this.prisma.user.upsert({
                where: {
                    id: userModel.id,
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

    async delete(id: UserId): Promise<void> {
        await this.prisma.user.delete({
            where: {
                id: id.toString(),
            },
        });
    }
}
