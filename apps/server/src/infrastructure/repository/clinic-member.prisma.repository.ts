import { Injectable } from "@nestjs/common";
import { ClinicId } from "@domain/clinic/entities";
import { ClinicMember, ClinicMemberId } from "@domain/clinic-member/entities";
import { ClinicMemberRepository } from "@domain/clinic-member/clinic-member.repository";
import { UserId } from "@domain/user/entities";
import { ClinicMemberMapper } from "@infrastructure/mappers/clinic-member.mapper";
import { PrismaProvider } from "@infrastructure/repository/prisma/prisma.provider";
import { PrismaRepository } from "@infrastructure/repository/prisma.repository";

@Injectable()
export class ClinicMemberPrismaRepository
  extends PrismaRepository
  implements ClinicMemberRepository
{
  constructor(
    readonly prismaProvider: PrismaProvider,
    private readonly mapper: ClinicMemberMapper,
  ) {
    super(prismaProvider);
  }

  async findById(id: ClinicMemberId): Promise<ClinicMember | null> {
    const member = await this.prisma.clinicMember.findFirst({
      where: { id: id.toString() },
    });

    return member === null ? null : this.mapper.toDomain(member);
  }

  async findByClinicAndUser(clinicId: ClinicId, userId: UserId): Promise<ClinicMember | null> {
    const member = await this.prisma.clinicMember.findFirst({
      where: {
        clinicId: clinicId.toString(),
        userId: userId.toString(),
        deletedAt: null,
      },
    });

    return member === null ? null : this.mapper.toDomain(member);
  }

  async findByUserId(userId: UserId): Promise<ClinicMember[]> {
    const members = await this.prisma.clinicMember.findMany({
      where: { userId: userId.toString(), deletedAt: null },
    });

    return members.map((m) => this.mapper.toDomain(m));
  }

  async findByClinicId(clinicId: ClinicId): Promise<ClinicMember[]> {
    const members = await this.prisma.clinicMember.findMany({
      where: { clinicId: clinicId.toString(), deletedAt: null },
    });

    return members.map((m) => this.mapper.toDomain(m));
  }

  async save(member: ClinicMember): Promise<void> {
    const data = this.mapper.toPersistence(member);

    await this.prisma.clinicMember.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }
}
