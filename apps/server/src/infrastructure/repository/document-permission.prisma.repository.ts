import { Injectable } from "@nestjs/common";
import { ClinicMemberId } from "@domain/clinic-member/entities";
import {
  DocumentEntityType,
  DocumentPermission,
  DocumentPermissionId,
} from "@domain/document-permission/entities";
import { DocumentPermissionRepository } from "@domain/document-permission/document-permission.repository";
import { DocumentPermissionMapper } from "@infrastructure/mappers/document-permission.mapper";
import { PrismaProvider } from "@infrastructure/repository/prisma/prisma.provider";
import { PrismaRepository } from "@infrastructure/repository/prisma.repository";

@Injectable()
export class DocumentPermissionPrismaRepository
  extends PrismaRepository
  implements DocumentPermissionRepository
{
  constructor(
    readonly prismaProvider: PrismaProvider,
    private readonly mapper: DocumentPermissionMapper,
  ) {
    super(prismaProvider);
  }

  async findById(id: DocumentPermissionId): Promise<DocumentPermission | null> {
    const permission = await this.prisma.documentPermission.findFirst({
      where: { id: id.toString() },
    });

    return permission === null ? null : this.mapper.toDomain(permission);
  }

  async findByMemberAndEntity(
    memberId: ClinicMemberId,
    entityType: DocumentEntityType,
    entityId: string,
  ): Promise<DocumentPermission | null> {
    const permission = await this.prisma.documentPermission.findFirst({
      where: { memberId: memberId.toString(), entityType, entityId },
    });

    return permission === null ? null : this.mapper.toDomain(permission);
  }

  async findByEntity(
    entityType: DocumentEntityType,
    entityId: string,
  ): Promise<DocumentPermission[]> {
    const permissions = await this.prisma.documentPermission.findMany({
      where: { entityType, entityId },
    });

    return permissions.map((p) => this.mapper.toDomain(p));
  }

  async save(permission: DocumentPermission): Promise<void> {
    const data = this.mapper.toPersistence(permission);

    await this.prisma.documentPermission.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async deleteMany(entityType: DocumentEntityType, entityId: string): Promise<void> {
    await this.prisma.documentPermission.deleteMany({ where: { entityType, entityId } });
  }
}
