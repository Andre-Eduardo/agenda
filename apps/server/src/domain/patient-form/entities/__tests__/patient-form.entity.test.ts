import {PatientForm, PatientFormId, FormResponseStatus} from '../patient-form.entity';
import {PatientId} from '../../../patient/entities';
import {ProfessionalId} from '../../../professional/entities';
import {FormTemplateId} from '../../../form-template/entities';
import {FormTemplateVersionId} from '../../../form-template-version/entities';
import {PreconditionException} from '../../../@shared/exceptions';

function makeForm(overrides: Partial<ConstructorParameters<typeof PatientForm>[0]> = {}) {
    return PatientForm.create({
        patientId: PatientId.generate(),
        professionalId: ProfessionalId.generate(),
        templateId: FormTemplateId.generate(),
        versionId: FormTemplateVersionId.generate(),
        appliedAt: new Date(),
        ...overrides,
    });
}

describe('PatientForm entity', () => {
    describe('create()', () => {
        it('should create with IN_PROGRESS status by default', () => {
            const form = makeForm();

            expect(form.status).toBe(FormResponseStatus.IN_PROGRESS);
            expect(form.responseJson).toEqual({answers: []});
            expect(form.completedAt).toBeNull();
            expect(form.computedJson).toBeNull();
        });
    });

    describe('saveDraft()', () => {
        it('should save answers and change status to DRAFT', () => {
            const form = makeForm();

            form.saveDraft({answers: [{fieldId: 'nome', valueText: 'João'}]});

            expect(form.status).toBe(FormResponseStatus.DRAFT);
            expect(form.responseJson.answers).toHaveLength(1);
        });

        it('should throw if form is already COMPLETED', () => {
            const form = makeForm();

            form.complete({answers: []});

            expect(() => form.saveDraft({answers: []})).toThrow(PreconditionException);
        });

        it('should throw if form is CANCELLED', () => {
            const form = makeForm();

            form.cancel();

            expect(() => form.saveDraft({answers: []})).toThrow(PreconditionException);
        });
    });

    describe('complete()', () => {
        it('should mark form as completed and set completedAt', () => {
            const form = makeForm();

            form.complete({answers: [{fieldId: 'nome', valueText: 'Maria'}]});

            expect(form.status).toBe(FormResponseStatus.COMPLETED);
            expect(form.completedAt).toBeInstanceOf(Date);
        });

        it('should store computedJson when provided', () => {
            const form = makeForm();

            form.complete({answers: []}, {totalScore: 42, classification: 'Alto'});

            expect(form.computedJson?.totalScore).toBe(42);
            expect(form.computedJson?.classification).toBe('Alto');
        });

        it('should throw if already completed', () => {
            const form = makeForm();

            form.complete({answers: []});

            expect(() => form.complete({answers: []})).toThrow(PreconditionException);
        });
    });

    describe('cancel()', () => {
        it('should cancel an in-progress form', () => {
            const form = makeForm();

            form.cancel();

            expect(form.status).toBe(FormResponseStatus.CANCELLED);
        });

        it('should throw when trying to cancel a completed form', () => {
            const form = makeForm();

            form.complete({answers: []});

            expect(() => form.cancel()).toThrow(PreconditionException);
        });
    });
});
