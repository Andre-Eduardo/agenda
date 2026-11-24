import {Module} from '@nestjs/common';
import {ClinicMemberController} from '@application/clinic-member/controllers/clinic-member.controller';
import {
    CreateClinicMemberService,
    GetCurrentClinicMemberPermissionsService,
    GetCurrentClinicMemberService,
    ListClinicMembersService,
} from '@application/clinic-member/services';
import {Authorizer, createAuthorizer} from '@domain/auth/authorizer';
import {ClinicLicenseRepository} from '@domain/clinic-license/clinic-license.repository';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {UserRepository} from '@domain/user/user.repository';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [ClinicMemberController],
    providers: [
        CreateClinicMemberService,
        ListClinicMembersService,
        GetCurrentClinicMemberService,
        GetCurrentClinicMemberPermissionsService,
        {
            provide: Authorizer,
            useFactory: createAuthorizer,
            inject: [UserRepository, ClinicMemberRepository, ClinicLicenseRepository],
        },
    ],
})
export class ClinicMemberModule {}
