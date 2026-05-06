import {Module} from '@nestjs/common';
import {ClinicMemberController} from '@application/clinic-member/controllers/clinic-member.controller';
import {CreateClinicMemberService, ListClinicMembersService} from '@application/clinic-member/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [ClinicMemberController],
    providers: [CreateClinicMemberService, ListClinicMembersService],
})
export class ClinicMemberModule {}
