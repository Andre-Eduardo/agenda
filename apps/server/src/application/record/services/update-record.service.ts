import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {RecordDto, UpdateRecordDto} from '@application/record/dtos';
import {AccessDeniedException, AccessDeniedReason, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {EventDispatcher} from '@domain/event';
import {PatientId} from '@domain/patient/entities';
import {ImportedDocumentId} from '@domain/record/entities';
import {ImportedDocumentRepository} from '@domain/record/imported-document.repository';
import {RecordRepository} from '@domain/record/record.repository';

@Injectable()
export class UpdateRecordService implements ApplicationService<UpdateRecordDto, RecordDto> {
    constructor(
        private readonly patientAccessChecker: PatientAccessChecker,
        private readonly recordRepository: RecordRepository,
        private readonly importedDocumentRepository: ImportedDocumentRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload: {id, ...props}}: Command<UpdateRecordDto>): Promise<RecordDto> {
        const record = await this.recordRepository.findById(id);

        if (record === null) {
            throw new ResourceNotFoundException('Record not found.', id.toString());
        }

        assertEntityBelongsToClinic(record.clinicId, actor.clinicId);
        await this.patientAccessChecker.assertCanAccess(actor, PatientId.from(record.patientId.toString()), 'write');

        if (record.isLocked) {
            throw new AccessDeniedException('RECORD_LOCKED', AccessDeniedReason.NOT_ALLOWED);
        }

        let importedDocumentId;

        if (props.importedDocumentId === undefined) {
            importedDocumentId = undefined;
        } else if (props.importedDocumentId) {
            importedDocumentId = ImportedDocumentId.from(props.importedDocumentId);
            const importedDocument = await this.importedDocumentRepository.findById(importedDocumentId);

            if (importedDocument === null) {
                throw new ResourceNotFoundException('Imported document not found.', props.importedDocumentId);
            }

            assertEntityBelongsToClinic(importedDocument.clinicId, actor.clinicId);

            if (!importedDocument.patientId.equals(record.patientId)) {
                throw new ResourceNotFoundException(
                    'Imported document does not belong to patient.',
                    props.importedDocumentId
                );
            }
        } else {
            importedDocumentId = null;
        }

        const changeProps = {
            ...props,
            importedDocumentId,
        };

        record.change(changeProps);

        await this.recordRepository.save(record);

        this.eventDispatcher.dispatch(actor, record);

        return new RecordDto(record);
    }
}
