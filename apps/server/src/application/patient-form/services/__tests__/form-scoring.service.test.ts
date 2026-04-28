import {FormScoringService} from '../form-scoring.service';
import type {FormDefinitionJson} from '../../../../domain/form-template/types';

const definitionWithScoring: FormDefinitionJson = {
    id: 'score_test',
    name: 'Score Test Form',
    specialty: 'PSICOLOGIA',
    sections: [
        {
            id: 'sec_1',
            label: 'Section',
            order: 1,
            fields: [
                {
                    id: 'q1',
                    type: 'radio',
                    label: 'Question 1',
                    order: 1,
                    options: [
                        {value: 'never', label: 'Never', score: 0},
                        {value: 'sometimes', label: 'Sometimes', score: 1},
                        {value: 'often', label: 'Often', score: 2},
                    ],
                    scoring: {weight: 1},
                },
                {
                    id: 'q2',
                    type: 'radio',
                    label: 'Question 2',
                    order: 2,
                    options: [
                        {value: 'never', label: 'Never', score: 0},
                        {value: 'sometimes', label: 'Sometimes', score: 1},
                        {value: 'often', label: 'Often', score: 2},
                    ],
                    scoring: {weight: 2},
                },
            ],
        },
    ],
    scoring: {
        enabled: true,
        rules: [
            {id: 'rule_low', label: 'Low', ranges: [{min: 0, max: 2, classification: 'Low', flag: 'LOW_RISK'}]},
            {id: 'rule_high', label: 'High', ranges: [{min: 3, max: 10, classification: 'High', flag: 'HIGH_RISK'}]},
        ],
    },
};

describe('FormScoringService', () => {
    let service: FormScoringService;

    beforeEach(() => {
        service = new FormScoringService();
    });

    it('should return null when scoring is disabled', () => {
        const noScoring: FormDefinitionJson = {
            ...definitionWithScoring,
            scoring: {enabled: false},
        };
        const result = service.compute(noScoring, [{fieldId: 'q1', valueText: 'often'}]);

        expect(result).toBeNull();
    });

    it('should compute total score correctly', () => {
        // q1=often(2) * weight(1) = 2; q2=sometimes(1) * weight(2) = 2; total = 4
        const result = service.compute(definitionWithScoring, [
            {fieldId: 'q1', valueText: 'often'},
            {fieldId: 'q2', valueText: 'sometimes'},
        ]);

        expect(result).not.toBeNull();
        expect(result!.totalScore).toBe(4);
    });

    it('should classify based on scoring rules', () => {
        // total = 0 + 0 = 0 -> Low
        const result = service.compute(definitionWithScoring, [
            {fieldId: 'q1', valueText: 'never'},
            {fieldId: 'q2', valueText: 'never'},
        ]);

        expect(result!.classification).toBe('Low');
        expect(result!.flags).toContain('LOW_RISK');
    });

    it('should classify High when score is in high range', () => {
        // q1=often(2)*1=2; q2=often(2)*2=4; total=6 -> High
        const result = service.compute(definitionWithScoring, [
            {fieldId: 'q1', valueText: 'often'},
            {fieldId: 'q2', valueText: 'often'},
        ]);

        expect(result!.classification).toBe('High');
    });

    it('should return scores array with per-field entries', () => {
        const result = service.compute(definitionWithScoring, [
            {fieldId: 'q1', valueText: 'sometimes'},
        ]);

        expect(result!.scores).toHaveLength(1);
        expect(result!.scores![0].fieldId).toBe('q1');
        expect(result!.scores![0].value).toBe(1);
    });
});
