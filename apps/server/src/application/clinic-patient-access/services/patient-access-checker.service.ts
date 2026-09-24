import {Injectable} from '@nestjs/common';
import type {Actor} from '@domain/@shared/actor';
import {AccessDeniedException, AccessDeniedReason} from '@domain/@shared/exceptions';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMemberRole} from '@domain/clinic-member/entities';
import {ClinicPatientAccessRepository} from '@domain/clinic-patient-access/clinic-patient-access.repository';
import {DocumentPermissionRepository} from '@domain/document-permission/document-permission.repository';
import {DocumentEntityType} from '@domain/document-permission/entities';
import {PatientId} from '@domain/patient/entities';
import {RecordId} from '@domain/record/entities';

export type PatientAccessAction = 'read' | 'write' | 'register' | 'basic' | 'appointment';

@Injectable()
export class PatientAccessChecker {
    constructor(
        private readonly memberRepository: ClinicMemberRepository,
        private readonly accessRepository: ClinicPatientAccessRepository,
        private readonly documentPermissionRepository: DocumentPermissionRepository
    ) {}

    async assertCanAccess(actor: Actor, patientId: PatientId, action: PatientAccessAction): Promise<void> {
        if (await this.isManager(actor)) return;

        const access = await this.accessRepository.findByMemberAndPatient(actor.clinicMemberId, patientId);
        const allowed =
            access !== null &&
            access.clinicId.equals(actor.clinicId) &&
            access.memberId.equals(actor.clinicMemberId) &&
            access.patientId.equals(patientId) &&
            this.allows(access, action);

        if (!allowed) this.deny();
    }

    async assertCanReadDocument(
        actor: Actor,
        patientId: PatientId,
        entityType: DocumentEntityType,
        entityId: string
    ): Promise<void> {
        if (await this.isManager(actor)) return;
        const override = await this.documentPermissionRepository.findByMemberAndEntity(
            actor.clinicMemberId,
            entityType,
            entityId
        );

        if (override !== null) {
            if (
                !override.clinicId.equals(actor.clinicId) ||
                !override.memberId.equals(actor.clinicMemberId) ||
                override.entityType !== entityType ||
                override.entityId !== entityId ||
                !override.canView
            )
                this.deny();

            return;
        }

        const access = await this.accessRepository.findByMemberAndPatient(actor.clinicMemberId, patientId);

        if (
            access === null ||
            !access.clinicId.equals(actor.clinicId) ||
            !access.patientId.equals(patientId) ||
            !access.canRead()
        )
            this.deny();
    }

    readablePatientIds(actor: Actor): Promise<PatientId[] | null> {
        return this.patientIdsForAction(actor, 'read');
    }

    async patientIdsForAction(actor: Actor, action: PatientAccessAction): Promise<PatientId[] | null> {
        if (await this.isManager(actor)) return null;
        const accesses = await this.accessRepository.findByMemberId(actor.clinicId, actor.clinicMemberId);

        return accesses
            .filter(
                (access) =>
                    access.clinicId.equals(actor.clinicId) &&
                    access.memberId.equals(actor.clinicMemberId) &&
                    this.allows(access, action)
            )
            .map((access) => access.patientId);
    }

    async recordVisibility(actor: Actor): Promise<{
        patientIds: PatientId[];
        allowedRecordIds: RecordId[];
        deniedRecordIds: RecordId[];
    } | null> {
        const patientIds = await this.readablePatientIds(actor);

        if (patientIds === null) return null;

        const overrides = await this.documentPermissionRepository.findByMemberAndType(
            actor.clinicId,
            actor.clinicMemberId,
            DocumentEntityType.RECORD
        );

        return {
            patientIds,
            allowedRecordIds: overrides
                .filter((permission) => permission.canView)
                .map((permission) => RecordId.from(permission.entityId)),
            deniedRecordIds: overrides
                .filter((permission) => !permission.canView)
                .map((permission) => RecordId.from(permission.entityId)),
        };
    }

    private allows(
        access: {canRead(): boolean; canWrite(): boolean; canRegister(): boolean},
        action: PatientAccessAction
    ): boolean {
        switch (action) {
            case 'read':
                return access.canRead();
            case 'write':
                return access.canWrite();
            case 'register':
                return access.canRegister();
            case 'appointment':
            case 'basic':
                return access.canRead() || access.canRegister();
        }

        return false;
    }

    private async isManager(actor: Actor): Promise<boolean> {
        const member = await this.memberRepository.findById(actor.clinicMemberId);

        if (
            member === null ||
            !member.isActive ||
            !member.clinicId.equals(actor.clinicId) ||
            !member.userId.equals(actor.userId)
        ) {
            this.deny();
        }

        return member.roles.includes(ClinicMemberRole.OWNER) || member.roles.includes(ClinicMemberRole.ADMIN);
    }

    private deny(): never {
        throw new AccessDeniedException('Patient access denied.', AccessDeniedReason.NOT_ALLOWED);
    }
}
