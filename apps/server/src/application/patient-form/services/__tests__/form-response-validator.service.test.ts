import {FormResponseValidatorService} from '../form-response-validator.service';
import {InvalidInputException} from '../../../../domain/@shared/exceptions';
import type {FormDefinitionJson} from '../../../../domain/form-template/types';

const definition: FormDefinitionJson = {
    id: 'test',
    name: 'Test Form',
    specialty: 'PSICOLOGIA',
    sections: [
        {
            id: 'sec_1',
            label: 'Personal',
            order: 1,
            fields: [
                {id: 'nome', type: 'text', label: 'Name', order: 1, required: true},
                {id: 'idade', type: 'number', label: 'Age', order: 2, required: true, validation: {min: 0, max: 150}},
                {id: 'genero', type: 'select', label: 'Gender', order: 3, required: false, options: [
                    {value: 'M', label: 'Male'},
                    {value: 'F', label: 'Female'},
                ]},
                {id: 'ativo', type: 'boolean', label: 'Active', order: 4, required: false},
            ],
        },
    ],
};

describe('FormResponseValidatorService', () => {
    let validator: FormResponseValidatorService;

    beforeEach(() => {
        validator = new FormResponseValidatorService();
    });

    it('should pass with all required fields present', () => {
        expect(() =>
            validator.validate({
                definition,
                answers: [
                    {fieldId: 'nome', valueText: 'João'},
                    {fieldId: 'idade', valueNumber: 30},
                ],
            })
        ).not.toThrow();
    });

    it('should throw when a required text field is missing', () => {
        expect(() =>
            validator.validate({
                definition,
                answers: [{fieldId: 'idade', valueNumber: 30}],
            })
        ).toThrow(InvalidInputException);
    });

    it('should throw when age is below minimum', () => {
        expect(() =>
            validator.validate({
                definition,
                answers: [
                    {fieldId: 'nome', valueText: 'X'},
                    {fieldId: 'idade', valueNumber: -5},
                ],
            })
        ).toThrow(InvalidInputException);
    });

    it('should throw when age is above maximum', () => {
        expect(() =>
            validator.validate({
                definition,
                answers: [
                    {fieldId: 'nome', valueText: 'X'},
                    {fieldId: 'idade', valueNumber: 200},
                ],
            })
        ).toThrow(InvalidInputException);
    });

    it('should throw for invalid select option', () => {
        expect(() =>
            validator.validate({
                definition,
                answers: [
                    {fieldId: 'nome', valueText: 'X'},
                    {fieldId: 'idade', valueNumber: 30},
                    {fieldId: 'genero', valueText: 'INVALID_OPTION'},
                ],
            })
        ).toThrow(InvalidInputException);
    });

    it('should throw for unknown field', () => {
        expect(() =>
            validator.validate({
                definition,
                answers: [
                    {fieldId: 'nome', valueText: 'X'},
                    {fieldId: 'idade', valueNumber: 30},
                    {fieldId: 'campo_desconhecido', valueText: 'oops'},
                ],
            })
        ).toThrow(InvalidInputException);
    });

    it('should accept valid select option', () => {
        expect(() =>
            validator.validate({
                definition,
                answers: [
                    {fieldId: 'nome', valueText: 'X'},
                    {fieldId: 'idade', valueNumber: 30},
                    {fieldId: 'genero', valueText: 'M'},
                    {fieldId: 'ativo', valueBoolean: true},
                ],
            })
        ).not.toThrow();
    });
});
