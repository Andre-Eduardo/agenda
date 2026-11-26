import {Injectable} from '@nestjs/common';
import type {Actor} from '@domain/@shared/actor';
import {AccessDeniedException, AccessDeniedReason} from '@domain/@shared/exceptions';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {type ClinicMember, ClinicMemberRole} from '@domain/clinic-member/entities';
import {ClinicPatientAccessRepository} from '@domain/clinic-patient-access/clinic-patient-access.repository';
import type {ClinicPatientAccess} from '@domain/clinic-patient-access/entities';
import {DocumentPermissionRepository} from '@domain/document-permission/document-permission.repository';
import {DocumentEntityType} from '@domain/document-permission/entities';
import {PatientId} from '@domain/patient/entities';
import {RecordId} from '@domain/record/entities';

export type PatientAccessAction = 'read' | 'write' | 'register' | 'basic' | 'appointment';

export type PatientClinicalAccess = {canRead: boolean; canWrite: boolean};

/** O suporte global vê o cadastro e a agenda do paciente, nunca o dado clínico (LGPD). */
const SUPPORT_ACTIONS: ReadonlySet<PatientAccessAction> = new Set(['basic', 'appointment']);

@Injectable()
export class PatientAccessChecker {
    constructor(
        private readonly memberRepository: ClinicMemberRepository,
        private readonly accessRepository: ClinicPatientAccessRepository,
        private readonly documentPermissionRepository: DocumentPermissionRepository
    ) {}

    async assertCanAccess(actor: Actor, patientId: PatientId, action: PatientAccessAction): Promise<void> {
        await this.requireAccess(actor, patientId, action);
    }

    async clinicalAccessForPatient(actor: Actor, patientId: PatientId): Promise<PatientClinicalAccess> {
        if ((await this.activeMember(actor)).supportAccess) return {canRead: false, canWrite: false};

        const access = await this.requireAccess(actor, patientId, 'basic');

        return {canRead: access?.canRead() ?? true, canWrite: access?.canWrite() ?? true};
    }

    async assertCanReadDocument(
        actor: Actor,
        patientId: PatientId,
        entityType: DocumentEntityType,
        entityId: string
    ): Promise<void> {
        const member = await this.activeMember(actor);

        if (member.supportAccess) this.deny();

        if (this.isManager(member)) return;
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
        const member = await this.activeMember(actor);

        if (member.supportAccess) return SUPPORT_ACTIONS.has(action) ? null : [];

        if (this.isManager(member)) return null;
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

    private async requireAccess(
        actor: Actor,
        patientId: PatientId,
        action: PatientAccessAction
    ): Promise<ClinicPatientAccess | null> {
        const member = await this.activeMember(actor);

        if (member.supportAccess) {
            if (SUPPORT_ACTIONS.has(action)) return null;

            this.deny();
        }

        if (this.isManager(member)) return null;

        const access = await this.accessRepository.findByMemberAndPatient(actor.clinicMemberId, patientId);

        if (
            access === null ||
            !access.clinicId.equals(actor.clinicId) ||
            !access.memberId.equals(actor.clinicMemberId) ||
            !access.patientId.equals(patientId) ||
            !this.allows(access, action)
        ) {
            this.deny();
        }

        return access;
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

    private isManager(member: ClinicMember): boolean {
        return member.roles.includes(ClinicMemberRole.OWNER) || member.roles.includes(ClinicMemberRole.ADMIN);
    }

    private async activeMember(actor: Actor): Promise<ClinicMember> {
        const member = await this.memberRepository.findById(actor.clinicMemberId);

        if (
            member === null ||
            !member.isActive ||
            !member.clinicId.equals(actor.clinicId) ||
            !member.userId.equals(actor.userId)
        ) {
            this.deny();
        }

        return member;
    }

    private deny(): never {
        throw new AccessDeniedException('Patient access denied.', AccessDeniedReason.NOT_ALLOWED);
    }
}
