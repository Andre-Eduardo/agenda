import {Module} from '@nestjs/common';
import {ClinicMemberController} from '@application/clinic-member/controllers/clinic-member.controller';
import {
    CreateClinicMemberAccountService,
    CreateClinicMemberService,
    GetCurrentClinicMemberPermissionsService,
    GetCurrentClinicMemberService,
    ListClinicMembersService,
} from '@application/clinic-member/services';
import {Authorizer, createAuthorizer} from '@domain/auth/authorizer';
import {ClinicLicenseRepository} from '@domain/clinic-license/clinic-license.repository';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicRepository} from '@domain/clinic/clinic.repository';
import {UserRepository} from '@domain/user/user.repository';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [ClinicMemberController],
    providers: [
        CreateClinicMemberService,
        CreateClinicMemberAccountService,
        ListClinicMembersService,
        GetCurrentClinicMemberService,
        GetCurrentClinicMemberPermissionsService,
        {
            provide: Authorizer,
            useFactory: createAuthorizer,
            inject: [UserRepository, ClinicMemberRepository, ClinicLicenseRepository, ClinicRepository],
        },
    ],
})
export class ClinicMemberModule {}
