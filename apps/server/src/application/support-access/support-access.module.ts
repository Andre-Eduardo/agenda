import {Module} from '@nestjs/common';
import {SupportAccessController} from '@application/support-access/controllers/support-access.controller';
import {
    CreateSupportUserService,
    EnterSupportAccessService,
    LeaveSupportAccessService,
    ListSupportUsersService,
    RevokeSupportUserService,
} from '@application/support-access/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [SupportAccessController],
    providers: [
        EnterSupportAccessService,
        LeaveSupportAccessService,
        ListSupportUsersService,
        CreateSupportUserService,
        RevokeSupportUserService,
    ],
})
export class SupportAccessModule {}
