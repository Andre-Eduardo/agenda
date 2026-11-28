import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {toEnum} from '@domain/@shared/utils';
import {AppointmentPaymentId, PaymentMethod} from '@domain/appointment-payment/entities';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {FinancialAccountId} from '@domain/financial-account/entities';
import {
    AccountMovement,
    AccountMovementCategory,
    AccountMovementDirection,
    AccountMovementId,
    FinancialEntry,
    FinancialEntryDirection,
    FinancialEntryId,
    FinancialEntryOriginType,
} from '@domain/financial-entry/entities';

export type AccountMovementModel = PrismaClient.AccountMovement;
export type FinancialEntryModel = PrismaClient.FinancialEntry;
export type FinancialEntryWithMovementsModel = FinancialEntryModel & {movements: AccountMovementModel[]};

@Injectable()
export class FinancialEntryMapper {
    toDomain(model: FinancialEntryWithMovementsModel): FinancialEntry {
        return new FinancialEntry({
            id: FinancialEntryId.from(model.id),
            clinicId: ClinicId.from(model.clinicId),
            direction: toEnum(FinancialEntryDirection, model.direction),
            originType: toEnum(FinancialEntryOriginType, model.originType),
            appointmentPaymentId: model.appointmentPaymentId
                ? AppointmentPaymentId.from(model.appointmentPaymentId)
                : null,
            description: model.description,
            amountCents: model.amountCents,
            competencyDate: model.competencyDate,
            createdByMemberId: ClinicMemberId.from(model.createdByMemberId),
            movements: model.movements.map((movement) => this.movementToDomain(movement)),
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: null,
        });
    }

    movementToDomain(model: AccountMovementModel): AccountMovement {
        return new AccountMovement({
            id: AccountMovementId.from(model.id),
            clinicId: ClinicId.from(model.clinicId),
            entryId: FinancialEntryId.from(model.entryId),
            accountId: FinancialAccountId.from(model.accountId),
            direction: toEnum(AccountMovementDirection, model.direction),
            category: toEnum(AccountMovementCategory, model.category),
            paymentMethod: toEnum(PaymentMethod, model.paymentMethod),
            amountCents: model.amountCents,
            movedAt: model.movedAt,
            reason: model.reason ?? null,
            reversesMovementId: model.reversesMovementId ? AccountMovementId.from(model.reversesMovementId) : null,
            responsibleMemberId: ClinicMemberId.from(model.responsibleMemberId),
            createdAt: model.createdAt,
            updatedAt: model.createdAt,
            deletedAt: null,
        });
    }

    toPersistence(entity: FinancialEntry): FinancialEntryModel {
        return {
            id: entity.id.toString(),
            clinicId: entity.clinicId.toString(),
            direction: entity.direction,
            originType: entity.originType,
            appointmentPaymentId: entity.appointmentPaymentId?.toString() ?? null,
            description: entity.description,
            amountCents: entity.amountCents,
            competencyDate: entity.competencyDate,
            createdByMemberId: entity.createdByMemberId.toString(),
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }

    movementToPersistence(entity: AccountMovement): AccountMovementModel {
        return {
            id: entity.id.toString(),
            clinicId: entity.clinicId.toString(),
            entryId: entity.entryId.toString(),
            accountId: entity.accountId.toString(),
            direction: entity.direction,
            category: entity.category,
            paymentMethod: entity.paymentMethod,
            amountCents: entity.amountCents,
            movedAt: entity.movedAt,
            reason: entity.reason,
            reversesMovementId: entity.reversesMovementId?.toString() ?? null,
            responsibleMemberId: entity.responsibleMemberId.toString(),
            createdAt: entity.createdAt,
        };
    }
}
