import {Injectable} from '@nestjs/common';
import {z} from 'zod';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {getRecordSchema} from '@application/record/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {EventDispatcher} from '@domain/event';
import {PatientId} from '@domain/patient/entities';
import {RecordRepository} from '@domain/record/record.repository';

type DeleteRecordDto = z.infer<typeof getRecordSchema>;

@Injectable()
export class DeleteRecordService implements ApplicationService<DeleteRecordDto> {
    constructor(
        private readonly patientAccessChecker: PatientAccessChecker,
        private readonly recordRepository: RecordRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<DeleteRecordDto>): Promise<void> {
        const record = await this.recordRepository.findById(payload.id);

        if (record === null) {
            throw new ResourceNotFoundException('Record not found.', payload.id.toString());
        }

        assertEntityBelongsToClinic(record.clinicId, actor.clinicId);
        await this.patientAccessChecker.assertCanAccess(actor, PatientId.from(record.patientId.toString()), 'write');

        record.delete();

        await this.recordRepository.delete(record.id);

        this.eventDispatcher.dispatch(actor, record);
    }
}
