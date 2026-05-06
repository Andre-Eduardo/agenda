import {DocumentId} from '../document-id.vo';

describe('A value object representing a document ID', () => {
    it.each([
        '967.921.935-69',
        '96792193569',
        '21.990.561-7',
        '713.834.203.623',
        '07778830001-40',
        '85.092.598/0001-49',
        '99.999.999',
    ])('can be created from a valid string', (documentId) => {
        expect(() => DocumentId.create(documentId)).not.toThrow();
        expect(DocumentId.create(documentId)).toBeInstanceOf(DocumentId);
    });

    it.each([
        '12222a',
        '123..456.78901',
        '123.456--78901111',
        '123456789-.17',
        '123456789.-17',
        '.123',
        '-123',
        '123!',
        '123.',
        '123-',
    ])('should reject invalid values', (documentId) => {
        expect(() => DocumentId.validate(documentId)).toThrow('Invalid document ID format.');
    });

    it('should be comparable', () => {
        const documentId = DocumentId.create('12345678901');
        const documentId2 = DocumentId.create('12345678901');
        const documentId3 = DocumentId.create('12345678902');
        const documentId4 = DocumentId.create('123.456.789-01');

        expect(documentId.equals(documentId2)).toBe(true);
        expect(documentId.equals(documentId3)).toBe(false);
        expect(documentId.equals(documentId4)).toBe(true);
    });

    it('can be converted to a string', () => {
        const documentId = DocumentId.create('12345678901');
        const documentId2 = DocumentId.create('123.456.789-01');

        expect(documentId.toString()).toEqual('12345678901');
        expect(documentId2.toString()).toEqual('12345678901');
    });

    it('can be converted to a JSON', () => {
        const documentId = DocumentId.create('12345678901');
        const documentId2 = DocumentId.create('123.456.789-01');

        expect(documentId.toJSON()).toEqual('12345678901');
        expect(documentId2.toJSON()).toEqual('12345678901');
    });
});
