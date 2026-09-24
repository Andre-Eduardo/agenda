import {mock} from 'jest-mock-extended';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import type {Actor} from '@domain/@shared/actor';
import {AccessDeniedException} from '@domain/@shared/exceptions';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMember, ClinicMemberId, ClinicMemberRole} from '@domain/clinic-member/entities';
import {ClinicPatientAccessRepository} from '@domain/clinic-patient-access/clinic-patient-access.repository';
import {ClinicPatientAccess, PatientAccessLevel} from '@domain/clinic-patient-access/entities';
import {ClinicId} from '@domain/clinic/entities';
import {DocumentPermissionRepository} from '@domain/document-permission/document-permission.repository';
import {DocumentEntityType, DocumentPermission} from '@domain/document-permission/entities';
import {PatientId} from '@domain/patient/entities';
import {UserId} from '@domain/user/entities';

function setup(role: ClinicMemberRole = ClinicMemberRole.PROFESSIONAL) {
    const actor: Actor = {
        userId: UserId.generate(),
        clinicId: ClinicId.generate(),
        clinicMemberId: ClinicMemberId.generate(),
        ip: '127.0.0.1',
    };
    const patientId = PatientId.generate();
    const memberRepository = mock<ClinicMemberRepository>();
    const accessRepository = mock<ClinicPatientAccessRepository>();
    const documentPermissionRepository = mock<DocumentPermissionRepository>();
    const member = ClinicMember.create({
        userId: actor.userId,
        clinicId: actor.clinicId,
        roles: [role],
        displayName: null,
        color: null,
        isActive: true,
        invitedByMemberId: null,
    });

    member.id = actor.clinicMemberId;
    memberRepository.findById.mockResolvedValue(member);
    const access = ClinicPatientAccess.create({
        clinicId: actor.clinicId,
        memberId: actor.clinicMemberId,
        patientId,
        accessLevel: PatientAccessLevel.READ_ONLY,
        reason: null,
    });

    accessRepository.findByMemberAndPatient.mockResolvedValue(access);
    const checker = new PatientAccessChecker(memberRepository, accessRepository, documentPermissionRepository);

    return {
        actor,
        patientId,
        member,
        access,
        checker,
        memberRepository,
        accessRepository,
        documentPermissionRepository,
    };
}

describe('PatientAccessChecker', () => {
    it('lets clinic managers access their own patients', async () => {
        const {actor, patientId, checker, accessRepository} = setup(ClinicMemberRole.OWNER);

        await expect(checker.assertCanAccess(actor, patientId, 'write')).resolves.toBeUndefined();
        expect(accessRepository.findByMemberAndPatient).not.toHaveBeenCalled();
    });

    it.each(['inactive', 'other user', 'other clinic'])('denies an %s member', async (condition) => {
        const {actor, patientId, checker, member} = setup();

        if (condition === 'inactive') member.isActive = false;

        if (condition === 'other user') member.userId = UserId.generate();

        if (condition === 'other clinic') member.clinicId = ClinicId.generate();
        await expect(checker.assertCanAccess(actor, patientId, 'read')).rejects.toThrow(AccessDeniedException);
    });

    it('denies a different patient and a write with read-only access', async () => {
        const {actor, patientId, checker} = setup();

        await expect(checker.assertCanAccess(actor, PatientId.generate(), 'read')).rejects.toThrow(
            AccessDeniedException
        );
        await expect(checker.assertCanAccess(actor, patientId, 'write')).rejects.toThrow(AccessDeniedException);
        await expect(checker.assertCanAccess(actor, patientId, 'read')).resolves.toBeUndefined();
    });

    it('honors a document denial even when patient access allows reading', async () => {
        const {actor, patientId, checker, documentPermissionRepository} = setup();
        const documentId = crypto.randomUUID();

        documentPermissionRepository.findByMemberAndEntity.mockResolvedValue(
            DocumentPermission.create({
                clinicId: actor.clinicId,
                memberId: actor.clinicMemberId,
                entityType: DocumentEntityType.RECORD,
                entityId: documentId,
                canView: false,
                grantedByMemberId: actor.clinicMemberId,
                reason: null,
            })
        );
        await expect(
            checker.assertCanReadDocument(actor, patientId, DocumentEntityType.RECORD, documentId)
        ).rejects.toThrow(AccessDeniedException);
    });

    it('filters list access to readable patients in the current clinic', async () => {
        const {actor, patientId, checker, access, accessRepository} = setup();
        const other = ClinicPatientAccess.create({
            clinicId: actor.clinicId,
            memberId: actor.clinicMemberId,
            patientId: PatientId.generate(),
            accessLevel: PatientAccessLevel.NONE,
            reason: null,
        });

        accessRepository.findByMemberId.mockResolvedValue([access, other]);
        await expect(checker.readablePatientIds(actor)).resolves.toEqual([patientId]);
    });
});
