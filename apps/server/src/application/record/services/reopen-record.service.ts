import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {RecordAuthorAccess} from '@application/clinic-patient-access/services/record-author-access.service';
import {RecordDto, ReopenRecordDto} from '@application/record/dtos';
import {AccessDeniedException, AccessDeniedReason, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {Transactional} from '@domain/@shared/repository';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMemberRole} from '@domain/clinic-member/entities/clinic-member-role';
import {EventDispatcher} from '@domain/event';
import {PatientId} from '@domain/patient/entities';
import {RecordAmendment} from '@domain/record/entities/record-amendment.entity';
import {RecordAmendmentRepository} from '@domain/record/record-amendment.repository';
import {RecordRepository} from '@domain/record/record.repository';

const ALLOWED_ROLES: ClinicMemberRole[] = [
    ClinicMemberRole.PROFESSIONAL,
    ClinicMemberRole.ADMIN,
    ClinicMemberRole.OWNER,
];

@Injectable()
export class ReopenRecordService implements ApplicationService<ReopenRecordDto, RecordDto> {
    constructor(
        private readonly patientAccessChecker: PatientAccessChecker,
        private readonly recordRepository: RecordRepository,
        private readonly recordAmendmentRepository: RecordAmendmentRepository,
        private readonly clinicMemberRepository: ClinicMemberRepository,
        private readonly recordAuthorAccess: RecordAuthorAccess,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    @Transactional()
    async execute({actor, payload}: Command<ReopenRecordDto>): Promise<RecordDto> {
        const member = await this.clinicMemberRepository.findById(actor.clinicMemberId);

        if (member === null || !member.roles.some((role) => ALLOWED_ROLES.includes(role))) {
            throw new AccessDeniedException('RECORD_REOPEN_FORBIDDEN', AccessDeniedReason.INSUFFICIENT_PERMISSIONS);
        }

        await this.recordRepository.lockForChange(payload.id, actor.clinicId);

        const record = await this.recordRepository.findById(payload.id);

        if (record === null) {
            throw new ResourceNotFoundException('Record not found.', payload.id.toString());
        }

        await this.recordAuthorAccess.assertCanRead(actor, record);
        await this.patientAccessChecker.assertCanAccess(actor, PatientId.from(record.patientId.toString()), 'write');

        record.unlock(actor.clinicMemberId);

        const amendment = RecordAmendment.create({
            clinicId: actor.clinicId,
            recordId: record.id,
            requestedByMemberId: actor.clinicMemberId,
            justification: payload.justification,
            reopenedAt: record.updatedAt,
        });

        await this.recordRepository.save(record);
        await this.recordAmendmentRepository.save(amendment);
        this.eventDispatcher.dispatch(actor, record);

        return new RecordDto(record);
    }
}
