import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {ClinicId} from '../../domain/clinic/entities';
import {ClinicMemberId} from '../../domain/clinic-member/entities';
import {MemberBlock, MemberBlockId} from '../../domain/professional/entities';
import {MapperWithoutDto} from './mapper';

export type MemberBlockModel = PrismaClient.MemberBlock;

@Injectable()
export class MemberBlockMapper extends MapperWithoutDto<MemberBlock, MemberBlockModel> {
    toDomain(model: MemberBlockModel): MemberBlock {
        return new MemberBlock({
            id: MemberBlockId.from(model.id),
            clinicId: ClinicId.from(model.clinicId),
            clinicMemberId: ClinicMemberId.from(model.clinicMemberId),
            startAt: model.startAt,
            endAt: model.endAt,
            reason: model.reason ?? null,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: model.deletedAt ?? null,
        });
    }

    toPersistence(entity: MemberBlock): MemberBlockModel {
        return {
            id: entity.id.toString(),
            clinicId: entity.clinicId.toString(),
            clinicMemberId: entity.clinicMemberId.toString(),
            startAt: entity.startAt,
            endAt: entity.endAt,
            reason: entity.reason,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt ?? null,
        };
    }
}
