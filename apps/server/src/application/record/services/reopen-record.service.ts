import {Injectable} from '@nestjs/common';
import {AccessDeniedException, AccessDeniedReason, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {ClinicMemberRepository} from '../../../domain/clinic-member/clinic-member.repository';
import {ClinicMemberRole} from '../../../domain/clinic-member/entities/clinic-member-role';
import {EventDispatcher} from '../../../domain/event';
import {RecordAmendment} from '../../../domain/record/entities/record-amendment.entity';
import {RecordAmendmentRepository} from '../../../domain/record/record-amendment.repository';
import {RecordRepository} from '../../../domain/record/record.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {RecordDto, ReopenRecordDto} from '../dtos';

const ALLOWED_ROLES: ClinicMemberRole[] = [ClinicMemberRole.PROFESSIONAL, ClinicMemberRole.ADMIN, ClinicMemberRole.OWNER];

@Injectable()
export class ReopenRecordService implements ApplicationService<ReopenRecordDto, RecordDto> {
    constructor(
        private readonly recordRepository: RecordRepository,
        private readonly recordAmendmentRepository: RecordAmendmentRepository,
        private readonly clinicMemberRepository: ClinicMemberRepository,
        private readonly eventDispatcher: EventDispatcher,
    ) {}

    async execute({actor, payload}: Command<ReopenRecordDto>): Promise<RecordDto> {
        const member = await this.clinicMemberRepository.findById(actor.clinicMemberId);
        if (member === null || !ALLOWED_ROLES.includes(member.role)) {
            throw new AccessDeniedException('RECORD_REOPEN_FORBIDDEN', AccessDeniedReason.INSUFFICIENT_PERMISSIONS);
        }

        const record = await this.recordRepository.findById(payload.id);
        if (record === null) {
            throw new ResourceNotFoundException('Record not found.', payload.id.toString());
        }

        record.unlock(actor.clinicMemberId);

        const amendment = RecordAmendment.create({
            clinicId: actor.clinicId,
            recordId: record.id,
            requestedByMemberId: actor.clinicMemberId,
            justification: payload.justification,
            reopenedAt: new Date(),
        });

        await this.recordRepository.save(record);
        await this.recordAmendmentRepository.save(amendment);
        this.eventDispatcher.dispatch(actor, record);

        return new RecordDto(record);
    }
}
