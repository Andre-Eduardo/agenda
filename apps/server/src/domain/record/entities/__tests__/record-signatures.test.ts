import {AccessDeniedException, InvalidInputException} from '@domain/@shared/exceptions';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {PatientId} from '@domain/patient/entities';
import {ProfessionalId} from '@domain/professional/entities';
import {Record, RecordAmendment, RecordSource} from '@domain/record/entities';

const clinicId = ClinicId.generate();
const memberId = ClinicMemberId.generate();
const reopenedAt = new Date('2027-01-01T10:00:00Z');

function createNote(): Record {
    return Record.create({
        clinicId,
        createdByMemberId: memberId,
        responsibleProfessionalId: ProfessionalId.generate(),
        patientId: PatientId.generate(),
        description: 'Initial note',
        conductTags: [],
        source: RecordSource.MANUAL,
        files: [],
        wasHumanEdited: false,
        isLocked: false,
    });
}

describe('record signatures', () => {
    it('locks edits and retains the last signature during an amendment', () => {
        const note = createNote();

        note.sign(memberId);
        const {signedAt} = note;

        expect(() => note.change({description: 'Silent edit'})).toThrow(AccessDeniedException);
        expect(note.description).toBe('Initial note');

        note.unlock(memberId);

        expect(note.signedAt).toBe(signedAt);
        expect(() => note.delete()).toThrow(AccessDeniedException);
        note.change({description: 'Amended note'});
        expect(note.description).toBe('Amended note');
    });

    it('trims a reopening reason and records the time of the new signature', () => {
        const amendment = RecordAmendment.create({
            clinicId,
            recordId: createNote().id,
            requestedByMemberId: memberId,
            justification: '  Correct typing error.  ',
            reopenedAt,
        });
        const relockedAt = new Date('2027-01-01T10:15:00Z');

        amendment.relock(relockedAt);

        expect(amendment.justification).toBe('Correct typing error.');
        expect(amendment.reopenedAt).toBe(reopenedAt);
        expect(amendment.relockedAt).toBe(relockedAt);
    });

    it.each(['   ', 'x'.repeat(2001)])('rejects a reopening reason outside the accepted length', (justification) => {
        expect(() =>
            RecordAmendment.create({
                clinicId,
                recordId: createNote().id,
                requestedByMemberId: memberId,
                justification,
                reopenedAt,
            })
        ).toThrow(InvalidInputException);
    });
});
