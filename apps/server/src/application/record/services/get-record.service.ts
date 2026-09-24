import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {GetRecordDto, RecordDto} from '@application/record/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {DocumentEntityType} from '@domain/document-permission/entities';
import {PatientId} from '@domain/patient/entities';
import {RecordRepository} from '@domain/record/record.repository';

@Injectable()
export class GetRecordService implements ApplicationService<GetRecordDto, RecordDto> {
    constructor(
        private readonly patientAccessChecker: PatientAccessChecker,
        private readonly recordRepository: RecordRepository
    ) {}

    async execute({actor, payload}: Command<GetRecordDto>): Promise<RecordDto> {
        const record = await this.recordRepository.findById(payload.id);

        if (record === null) {
            throw new ResourceNotFoundException('Record not found.', payload.id.toString());
        }

        assertEntityBelongsToClinic(record.clinicId, actor.clinicId);
        await this.patientAccessChecker.assertCanReadDocument(
            actor,
            PatientId.from(record.patientId.toString()),
            DocumentEntityType.RECORD,
            record.id.toString()
        );

        return new RecordDto(record);
    }
}
