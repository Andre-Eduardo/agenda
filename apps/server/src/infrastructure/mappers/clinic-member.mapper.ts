import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {toEnum} from '../../domain/@shared/utils';
import {ClinicId} from '../../domain/clinic/entities';
import {ClinicMember, ClinicMemberId, ClinicMemberRole} from '../../domain/clinic-member/entities';
import {UserId} from '../../domain/user/entities';
import {MapperWithoutDto} from './mapper';

export type ClinicMemberModel = PrismaClient.ClinicMember;

@Injectable()
export class ClinicMemberMapper extends MapperWithoutDto<ClinicMember, ClinicMemberModel> {
    toDomain(model: ClinicMemberModel): ClinicMember {
        return new ClinicMember({
            id: ClinicMemberId.from(model.id),
            clinicId: ClinicId.from(model.clinicId),
            userId: UserId.from(model.userId),
            role: toEnum(ClinicMemberRole, model.role),
            displayName: model.displayName,
            color: model.color,
            isActive: model.isActive,
            invitedByMemberId: model.invitedByMemberId === null ? null : ClinicMemberId.from(model.invitedByMemberId),
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: model.deletedAt ?? null,
        });
    }

    toPersistence(entity: ClinicMember): ClinicMemberModel {
        return {
            id: entity.id.toString(),
            clinicId: entity.clinicId.toString(),
            userId: entity.userId.toString(),
            role: toEnum(PrismaClient.ClinicMemberRole, entity.role),
            displayName: entity.displayName,
            color: entity.color,
            isActive: entity.isActive,
            invitedByMemberId: entity.invitedByMemberId?.toString() ?? null,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt ?? null,
        };
    }
}
