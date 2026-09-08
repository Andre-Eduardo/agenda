import {Module} from '@nestjs/common';
import {PatientPackageController} from '@application/patient-package/controllers/patient-package.controller';
import {ExpirePatientPackagesJob} from '@application/patient-package/jobs/expire-patient-packages.job';
import {
    GetPatientPackageCreditHistoryService,
    GetPatientPackagesService,
    SellPatientPackageService,
} from '@application/patient-package/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [PatientPackageController],
    providers: [
        GetPatientPackagesService,
        SellPatientPackageService,
        GetPatientPackageCreditHistoryService,
        ExpirePatientPackagesJob,
    ],
})
export class PatientPackageModule {}
