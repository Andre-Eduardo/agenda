import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {ClinicMemberController} from './controllers/clinic-member.controller';
import {CreateClinicMemberService, ListClinicMembersService} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [ClinicMemberController],
    providers: [CreateClinicMemberService, ListClinicMembersService],
})
export class ClinicMemberModule {}
