import {Module} from '@nestjs/common';
import {PackagePlanController} from '@application/package-plan/controllers/package-plan.controller';
import {
    CreatePackagePlanService,
    DeactivatePackagePlanService,
    ListPackagePlansService,
    UpdatePackagePlanService,
} from '@application/package-plan/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [PackagePlanController],
    providers: [
        CreatePackagePlanService,
        ListPackagePlansService,
        UpdatePackagePlanService,
        DeactivatePackagePlanService,
    ],
})
export class PackagePlanModule {}
