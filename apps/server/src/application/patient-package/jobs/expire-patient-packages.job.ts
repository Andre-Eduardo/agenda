import {Injectable, Logger} from '@nestjs/common';
import {Cron, CronExpression} from '@nestjs/schedule';
import {PatientPackageRepository} from '@domain/patient-package/patient-package.repository';

@Injectable()
export class ExpirePatientPackagesJob {
    private readonly logger = new Logger(ExpirePatientPackagesJob.name);

    constructor(private readonly patientPackageRepository: PatientPackageRepository) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handle(): Promise<void> {
        const expirable = await this.patientPackageRepository.findExpirable(new Date());

        for (const patientPackage of expirable) {
            patientPackage.expire();
            await this.patientPackageRepository.save(patientPackage);
        }

        if (expirable.length > 0) {
            this.logger.log(`Expired ${expirable.length} patient packages`);
        }
    }
}
