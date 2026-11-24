import {ClinicMemberRoleAuthorizer} from '@domain/auth/authorizer/clinic-member-role.authorizer';
import {GlobalAuthorizer} from '@domain/auth/authorizer/global.authorizer';
import {ModuleAuthorizer} from '@domain/auth/authorizer/module.authorizer';
import {MultiAuthorizer} from '@domain/auth/authorizer/multi.authorizer';
import type {ClinicLicenseRepository} from '@domain/clinic-license/clinic-license.repository';
import {ModuleAccess} from '@domain/clinic-license/services';
import type {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import type {UserRepository} from '@domain/user/user.repository';

/** Keep permission reads and the HTTP guard on the same authorization policy. */
export function createAuthorizer(
    userRepository: UserRepository,
    clinicMemberRepository: ClinicMemberRepository,
    clinicLicenseRepository: ClinicLicenseRepository
): ModuleAuthorizer {
    return new ModuleAuthorizer(
        new ModuleAccess(clinicLicenseRepository, clinicMemberRepository),
        new MultiAuthorizer(
            new GlobalAuthorizer(userRepository),
            new ClinicMemberRoleAuthorizer(clinicMemberRepository)
        )
    );
}
