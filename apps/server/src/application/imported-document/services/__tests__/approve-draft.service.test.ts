import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../../domain/@shared/actor';
import {PreconditionException, ResourceNotFoundException} from '../../../../../domain/@shared/exceptions';
import type {DraftEvolutionRepository} from '../../../../../domain/draft-evolution/draft-evolution.repository';
import {DraftEvolution, DraftEvolutionId, DraftEvolutionStatus} from '../../../../../domain/draft-evolution/entities/draft-evolution.entity';
import {DraftApprovedEvent} from '../../../../../domain/draft-evolution/events/draft-approved.event';
import type {EventDispatcher} from '../../../../../domain/event';
import {ClinicId} from '../../../../../domain/clinic/entities';
import {ClinicMemberId} from '../../../../../domain/clinic-member/entities';
import {PersonId} from '../../../../../domain/person/entities/person.entity';
import {ProfessionalId} from '../../../../../domain/professional/entities';
import type {Professional} from '../../../../../domain/professional/entities';
import type {ProfessionalRepository} from '../../../../../domain/professional/professional.repository';
import type {ImportedDocumentRepository} from '../../../../../domain/record/imported-document.repository';
import {ImportedDocument, ImportedDocumentId, ImportStatus} from '../../../../../domain/record/entities/imported-document.entity';
import {FileId} from '../../../../../domain/record/entities/file.entity';
import {Record, RecordSource} from '../../../../../domain/record/entities/record.entity';
import type {RecordRepository} from '../../../../../domain/record/record.repository';
import {UserId} from '../../../../../domain/user/entities';
import type {SubscriptionService} from '../../../../subscription/subscription.service';
import {ApproveDraftService} from '../approve-draft.service';

function fakeProfessional(clinicMemberId: ClinicMemberId): Pick<Professional, 'id' | 'clinicMemberId'> {
    return {id: ProfessionalId.generate(), clinicMemberId} as Pick<Professional, 'id' | 'clinicMemberId'>;
}

function fakeImportedDocument(clinicId: ClinicId, patientId: PersonId): ImportedDocument {
    return new ImportedDocument({
        id: ImportedDocumentId.generate(),
        clinicId,
        patientId,
        createdByMemberId: ClinicMemberId.generate(),
        fileId: FileId.generate(),
        documentType: null,
        qualityLabel: null,
        qualityScore: null,
        rawOcrText: null,
        normalizedOcrText: null,
        ocrConfidence: null,
        aiConfidence: 0.9,
        status: ImportStatus.AI_STRUCTURED,
        reviewRequired: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    });
}

function fakeDraft(opts: {
    importedDocumentId: ImportedDocumentId;
    clinicId: ClinicId;
    patientId: PersonId;
    wasHumanEdited?: boolean;
    status?: DraftEvolutionStatus;
}): DraftEvolution {
    return new DraftEvolution({
        id: DraftEvolutionId.generate(),
        clinicId: opts.clinicId,
        patientId: opts.patientId,
        createdByMemberId: ClinicMemberId.generate(),
        importedDocumentId: opts.importedDocumentId,
        templateType: null,
        title: 'AI Draft',
        attendanceType: null,
        clinicalStatus: null,
        conductTags: [],
        subjective: 'Patient complains of headache.',
        objective: null,
        assessment: null,
        plan: null,
        freeNotes: null,
        eventDate: null,
        overallConfidence: 0.9,
        status: opts.status ?? DraftEvolutionStatus.PENDING_REVIEW,
        wasHumanEdited: opts.wasHumanEdited ?? false,
        reviewRequired: true,
        approvedByMemberId: null,
        approvedAt: null,
        recordId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    });
}

describe('ApproveDraftService', () => {
    const importedDocumentRepository = mock<ImportedDocumentRepository>();
    const draftEvolutionRepository = mock<DraftEvolutionRepository>();
    const recordRepository = mock<RecordRepository>();
    const professionalRepository = mock<ProfessionalRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const subscriptionService = mock<SubscriptionService>();

    const service = new ApproveDraftService(
        importedDocumentRepository,
        draftEvolutionRepository,
        recordRepository,
        professionalRepository,
        eventDispatcher,
        subscriptionService,
    );

    const clinicId = ClinicId.generate();
    const clinicMemberId = ClinicMemberId.generate();
    const patientId = PersonId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        clinicId,
        clinicMemberId,
        ip: '127.0.0.1',
    };

    const now = new Date('2026-04-25T12:00:00.000Z');

    beforeEach(() => {
        jest.useFakeTimers({now});
        jest.clearAllMocks();
        subscriptionService.incrementUsage.mockResolvedValue(undefined as never);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should approve the draft, create a Record, and advance the document to APPROVED', async () => {
        const document = fakeImportedDocument(clinicId, patientId);
        const draft = fakeDraft({
            importedDocumentId: document.id,
            clinicId,
            patientId,
            wasHumanEdited: true,
        });

        importedDocumentRepository.findById.mockResolvedValueOnce(document);
        draftEvolutionRepository.findByImportedDocumentId.mockResolvedValueOnce(draft);
        professionalRepository.findByClinicMemberId.mockResolvedValueOnce(fakeProfessional(clinicMemberId) as Professional);

        const result = await service.execute({actor, payload: {id: document.id}});

        expect(result.status).toBe(DraftEvolutionStatus.APPROVED);
        expect(result.approvedByMemberId).toBe(clinicMemberId.toString());
        expect(result.approvedAt).toBe(now.toISOString());
        expect(result.recordId).not.toBeNull();
        expect(result.wasHumanEdited).toBe(true);

        expect(document.status).toBe(ImportStatus.APPROVED);

        expect(recordRepository.save).toHaveBeenCalledWith(expect.any(Record));
        expect(draftEvolutionRepository.save).toHaveBeenCalledWith(draft);
        expect(importedDocumentRepository.save).toHaveBeenCalledWith(document);
        expect(eventDispatcher.dispatch).toHaveBeenCalledTimes(2);

        expect(draft.events).toContainEqual(
            expect.objectContaining({type: DraftApprovedEvent.type})
        );
    });

    it('should create Record with source=IMPORT and wasHumanEdited carried from the draft', async () => {
        const document = fakeImportedDocument(clinicId, patientId);
        const draft = fakeDraft({
            importedDocumentId: document.id,
            clinicId,
            patientId,
            wasHumanEdited: false,
        });

        importedDocumentRepository.findById.mockResolvedValueOnce(document);
        draftEvolutionRepository.findByImportedDocumentId.mockResolvedValueOnce(draft);
        professionalRepository.findByClinicMemberId.mockResolvedValueOnce(fakeProfessional(clinicMemberId) as Professional);

        await service.execute({actor, payload: {id: document.id}});

        const savedRecord = recordRepository.save.mock.calls[0][0] as Record;
        expect(savedRecord.source).toBe(RecordSource.IMPORT);
        expect(savedRecord.wasHumanEdited).toBe(false);
        expect(savedRecord.importedDocumentId?.toString()).toBe(document.id.toString());
    });

    it('should throw ResourceNotFoundException when the ImportedDocument is not found', async () => {
        importedDocumentRepository.findById.mockResolvedValueOnce(null);

        await expect(
            service.execute({actor, payload: {id: ImportedDocumentId.generate()}})
        ).rejects.toThrowWithMessage(ResourceNotFoundException, 'ImportedDocument not found.');
    });

    it('should throw ResourceNotFoundException when the draft is not found', async () => {
        const document = fakeImportedDocument(clinicId, patientId);

        importedDocumentRepository.findById.mockResolvedValueOnce(document);
        draftEvolutionRepository.findByImportedDocumentId.mockResolvedValueOnce(null);

        await expect(
            service.execute({actor, payload: {id: document.id}})
        ).rejects.toThrowWithMessage(ResourceNotFoundException, 'Draft not found for this document.');
    });

    it('should throw PreconditionException when the actor has no Professional record', async () => {
        const document = fakeImportedDocument(clinicId, patientId);
        const draft = fakeDraft({
            importedDocumentId: document.id,
            clinicId,
            patientId,
        });

        importedDocumentRepository.findById.mockResolvedValueOnce(document);
        draftEvolutionRepository.findByImportedDocumentId.mockResolvedValueOnce(draft);
        professionalRepository.findByClinicMemberId.mockResolvedValueOnce(null);

        await expect(
            service.execute({actor, payload: {id: document.id}})
        ).rejects.toThrowWithMessage(PreconditionException, 'DRAFT_APPROVAL_REQUIRES_PROFESSIONAL');

        expect(recordRepository.save).not.toHaveBeenCalled();
    });

    it('should throw PreconditionException when the draft is already approved', async () => {
        const document = fakeImportedDocument(clinicId, patientId);
        const draft = fakeDraft({
            importedDocumentId: document.id,
            clinicId,
            patientId,
            status: DraftEvolutionStatus.APPROVED,
        });

        importedDocumentRepository.findById.mockResolvedValueOnce(document);
        draftEvolutionRepository.findByImportedDocumentId.mockResolvedValueOnce(draft);
        professionalRepository.findByClinicMemberId.mockResolvedValueOnce(fakeProfessional(clinicMemberId) as Professional);

        await expect(
            service.execute({actor, payload: {id: document.id}})
        ).rejects.toThrowWithMessage(PreconditionException, 'DRAFT_ALREADY_APPROVED');

        expect(recordRepository.save).not.toHaveBeenCalled();
    });

    it('should throw PreconditionException when the draft is rejected', async () => {
        const document = fakeImportedDocument(clinicId, patientId);
        const draft = fakeDraft({
            importedDocumentId: document.id,
            clinicId,
            patientId,
            status: DraftEvolutionStatus.REJECTED,
        });

        importedDocumentRepository.findById.mockResolvedValueOnce(document);
        draftEvolutionRepository.findByImportedDocumentId.mockResolvedValueOnce(draft);
        professionalRepository.findByClinicMemberId.mockResolvedValueOnce(fakeProfessional(clinicMemberId) as Professional);

        await expect(
            service.execute({actor, payload: {id: document.id}})
        ).rejects.toThrowWithMessage(PreconditionException, 'DRAFT_ALREADY_REJECTED');

        expect(recordRepository.save).not.toHaveBeenCalled();
    });
});
