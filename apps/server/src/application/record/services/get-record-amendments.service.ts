import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {GetRecordDto, RecordAmendmentDto} from '@application/record/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {DocumentEntityType} from '@domain/document-permission/entities';
import {PatientId} from '@domain/patient/entities';
import {RecordAmendmentRepository} from '@domain/record/record-amendment.repository';
import {RecordRepository} from '@domain/record/record.repository';

@Injectable()
export class GetRecordAmendmentsService implements ApplicationService<GetRecordDto, RecordAmendmentDto[]> {
    constructor(
        private readonly patientAccessChecker: PatientAccessChecker,
        private readonly recordRepository: RecordRepository,
        private readonly recordAmendmentRepository: RecordAmendmentRepository
    ) {}

    async execute({actor, payload}: Command<GetRecordDto>): Promise<RecordAmendmentDto[]> {
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

        const amendments = await this.recordAmendmentRepository.findAllByRecordId(payload.id);

        return amendments.map((a) => new RecordAmendmentDto(a));
    }
}
