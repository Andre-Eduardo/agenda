import {Injectable} from '@nestjs/common';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {DocumentPermissionRepository} from '@domain/document-permission/document-permission.repository';
import {DocumentEntityType, DocumentPermission, DocumentPermissionId} from '@domain/document-permission/entities';
import {DocumentPermissionMapper} from '@infrastructure/mappers/document-permission.mapper';
import {PrismaRepository} from '@infrastructure/repository/prisma.repository';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';

@Injectable()
export class DocumentPermissionPrismaRepository extends PrismaRepository implements DocumentPermissionRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: DocumentPermissionMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: DocumentPermissionId): Promise<DocumentPermission | null> {
        const permission = await this.prisma.documentPermission.findFirst({
            where: {id: id.toString()},
        });

        return permission === null ? null : this.mapper.toDomain(permission);
    }

    async findTargetClinic(entityType: DocumentEntityType, entityId: string): Promise<ClinicId | null> {
        let target: {clinicId: string} | null;

        switch (entityType) {
            case DocumentEntityType.RECORD:
                target = await this.prisma.record.findFirst({
                    where: {id: entityId, deletedAt: null},
                    select: {clinicId: true},
                });

                break;
            case DocumentEntityType.FILE:
                target = await this.prisma.file.findFirst({
                    where: {id: entityId, deletedAt: null},
                    select: {clinicId: true},
                });

                break;
            case DocumentEntityType.IMPORTED_DOCUMENT:
                target = await this.prisma.importedDocument.findFirst({
                    where: {id: entityId, deletedAt: null},
                    select: {clinicId: true},
                });

                break;
            case DocumentEntityType.PATIENT_FORM:
                target = await this.prisma.patientForm.findFirst({
                    where: {id: entityId, deletedAt: null},
                    select: {clinicId: true},
                });

                break;
            case DocumentEntityType.CLINICAL_PROFILE:
                target = await this.prisma.clinicalProfile.findFirst({
                    where: {id: entityId, deletedAt: null},
                    select: {clinicId: true},
                });

                break;
            case DocumentEntityType.PATIENT_ALERT:
                target = await this.prisma.patientAlert.findFirst({
                    where: {id: entityId, deletedAt: null},
                    select: {clinicId: true},
                });

                break;
        }

        return target === null ? null : ClinicId.from(target.clinicId);
    }

    async findByMemberAndEntity(
        memberId: ClinicMemberId,
        entityType: DocumentEntityType,
        entityId: string
    ): Promise<DocumentPermission | null> {
        const permission = await this.prisma.documentPermission.findFirst({
            where: {memberId: memberId.toString(), entityType, entityId},
        });

        return permission === null ? null : this.mapper.toDomain(permission);
    }

    async findByEntity(entityType: DocumentEntityType, entityId: string): Promise<DocumentPermission[]> {
        const permissions = await this.prisma.documentPermission.findMany({
            where: {entityType, entityId},
        });

        return permissions.map((p) => this.mapper.toDomain(p));
    }

    async findByMemberAndType(
        clinicId: ClinicId,
        memberId: ClinicMemberId,
        entityType: DocumentEntityType
    ): Promise<DocumentPermission[]> {
        const permissions = await this.prisma.documentPermission.findMany({
            where: {clinicId: clinicId.toString(), memberId: memberId.toString(), entityType},
        });

        return permissions.map((permission) => this.mapper.toDomain(permission));
    }

    async save(permission: DocumentPermission): Promise<void> {
        const data = this.mapper.toPersistence(permission);

        await this.prisma.documentPermission.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }

    async deleteMany(entityType: DocumentEntityType, entityId: string): Promise<void> {
        await this.prisma.documentPermission.deleteMany({where: {entityType, entityId}});
    }
}
