import {Authorizer} from '@domain/auth/authorizer/authorizer';
import {
    AppointmentPermission,
    AppointmentPaymentPermission,
    ClinicalChatPermission,
    ClinicalDocumentPermission,
    ClinicalProfilePermission,
    FormTemplatePermission,
    ImportedDocumentPermission,
    InsurancePlanPermission,
    InsuranceClaimPermission,
    MemberBlockPermission,
    PatientAlertPermission,
    PatientFormPermission,
    PatientPermission,
    PatientInsuranceEnrollmentPermission,
    PatientPackagePermission,
    PatientSubscriptionPermission,
    PatientSubscriptionPlanPermission,
    PackagePlanPermission,
    Permission,
    PersonPermission,
    ProfessionalPermission,
    RecordPermission,
    RoomPermission,
    UploadPermission,
    WorkingHoursPermission,
} from '@domain/auth/permission';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMemberId, ClinicMemberRole} from '@domain/clinic-member/entities';
import type {UserId} from '@domain/user/entities';

const PROFESSIONAL_PERMISSIONS: readonly Permission[] = [
    PatientPermission.VIEW,
    PatientPermission.CREATE,
    PatientPermission.UPDATE,
    AppointmentPermission.VIEW,
    AppointmentPermission.CREATE,
    AppointmentPermission.UPDATE,
    AppointmentPermission.CANCEL,
    AppointmentPermission.CHECKIN,
    AppointmentPermission.CALL,
    RecordPermission.VIEW,
    RecordPermission.CREATE,
    RecordPermission.UPDATE,
    ProfessionalPermission.VIEW,
    ProfessionalPermission.UPDATE,
    ClinicalProfilePermission.VIEW,
    ClinicalProfilePermission.UPDATE,
    PatientAlertPermission.VIEW,
    PatientAlertPermission.CREATE,
    PatientAlertPermission.UPDATE,
    PatientFormPermission.VIEW,
    PatientFormPermission.CREATE,
    PatientFormPermission.UPDATE,
    FormTemplatePermission.VIEW,
    ClinicalChatPermission.VIEW,
    ClinicalChatPermission.CREATE,
    ClinicalChatPermission.UPDATE,
    ClinicalDocumentPermission.VIEW,
    ClinicalDocumentPermission.CREATE,
    ClinicalDocumentPermission.GENERATE,
    ImportedDocumentPermission.VIEW,
    ImportedDocumentPermission.CREATE,
    ImportedDocumentPermission.UPDATE,
    UploadPermission.PREPARE,
    UploadPermission.UPLOAD,
    InsurancePlanPermission.VIEW,
    AppointmentPaymentPermission.VIEW,
    PatientInsuranceEnrollmentPermission.VIEW,
    InsuranceClaimPermission.VIEW,
    PackagePlanPermission.VIEW,
    PatientPackagePermission.VIEW,
    PatientSubscriptionPlanPermission.VIEW,
    PatientSubscriptionPermission.VIEW,
    RoomPermission.VIEW,
    WorkingHoursPermission.MANAGE,
    MemberBlockPermission.CREATE,
    MemberBlockPermission.LIST,
    MemberBlockPermission.DELETE,
];

const SECRETARY_PERMISSIONS: readonly Permission[] = [
    PatientPermission.VIEW,
    PatientPermission.CREATE,
    PatientPermission.UPDATE,
    PersonPermission.VIEW,
    PersonPermission.CREATE,
    PersonPermission.UPDATE,
    AppointmentPermission.VIEW,
    AppointmentPermission.CREATE,
    AppointmentPermission.UPDATE,
    AppointmentPermission.CANCEL,
    AppointmentPermission.CHECKIN,
    AppointmentPermission.CALL,
    RecordPermission.VIEW,
    ClinicalProfilePermission.VIEW,
    PatientAlertPermission.VIEW,
    PatientFormPermission.VIEW,
    PatientFormPermission.CREATE,
    UploadPermission.PREPARE,
    UploadPermission.UPLOAD,
    InsurancePlanPermission.VIEW,
    AppointmentPaymentPermission.VIEW,
    AppointmentPaymentPermission.REGISTER,
    AppointmentPaymentPermission.UPDATE,
    PatientInsuranceEnrollmentPermission.VIEW,
    PatientInsuranceEnrollmentPermission.CREATE,
    PatientInsuranceEnrollmentPermission.UPDATE,
    InsuranceClaimPermission.VIEW,
    InsuranceClaimPermission.UPDATE,
    PackagePlanPermission.VIEW,
    PatientPackagePermission.VIEW,
    PatientPackagePermission.SELL,
    PatientSubscriptionPlanPermission.VIEW,
    PatientSubscriptionPermission.VIEW,
    PatientSubscriptionPermission.SUBSCRIBE,
    PatientSubscriptionPermission.CANCEL,
    RoomPermission.VIEW,
    // Escopo real (quais profissionais) é resolvido por ProfessionalAgendaAccess,
    // não por este teto — ver AgendaAccessChecker.
    WorkingHoursPermission.MANAGE,
    MemberBlockPermission.CREATE,
    MemberBlockPermission.LIST,
    MemberBlockPermission.DELETE,
];

const VIEWER_PERMISSIONS: readonly Permission[] = [
    PatientPermission.VIEW,
    AppointmentPermission.VIEW,
    RecordPermission.VIEW,
    ClinicalProfilePermission.VIEW,
    PatientAlertPermission.VIEW,
    PatientFormPermission.VIEW,
];

/**
 * Teto de capacidade por papel dentro da clínica (Bloco de autorização granular).
 *
 * Um membro pode ter mais de um papel (ex: OWNER + PROFESSIONAL) — nesse caso
 * suas permissões são a UNIÃO dos papéis (ver ClinicMemberRoleAuthorizer), e
 * ele tem tanto agenda própria (papel PROFESSIONAL) quanto a capacidade de
 * gerenciar outras agendas (papel OWNER/ADMIN).
 *
 * OWNER/ADMIN têm tudo. PROFESSIONAL/SECRETARY/VIEWER têm um subconjunto —
 * a restrição fina por recurso (ex: quais profissionais uma SECRETARY pode
 * gerenciar a agenda) é resolvida em cima disso por entidades de acesso
 * granular (ClinicPatientAccess, ProfessionalAgendaAccess, DocumentPermission).
 */
export const clinicMemberRolePermissionsMap: Record<ClinicMemberRole, Set<Permission>> = {
    [ClinicMemberRole.OWNER]: Permission.all(),
    [ClinicMemberRole.ADMIN]: Permission.all(),
    [ClinicMemberRole.PROFESSIONAL]: new Set(PROFESSIONAL_PERMISSIONS),
    [ClinicMemberRole.SECRETARY]: new Set(SECRETARY_PERMISSIONS),
    [ClinicMemberRole.VIEWER]: new Set(VIEWER_PERMISSIONS),
};

export class ClinicMemberRoleAuthorizer extends Authorizer {
    constructor(private readonly clinicMemberRepository: ClinicMemberRepository) {
        super();
    }

    async getPermissions(clinicMemberId: ClinicMemberId | null, _userId: UserId): Promise<Set<Permission>> {
        if (clinicMemberId === null) {
            return new Set();
        }

        const member = await this.clinicMemberRepository.findById(clinicMemberId);

        if (member === null || !member.isActive) {
            return new Set();
        }

        const permissions = new Set<Permission>();

        for (const role of member.roles) {
            for (const permission of clinicMemberRolePermissionsMap[role]) {
                permissions.add(permission);
            }
        }

        return permissions;
    }
}
