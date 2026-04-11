import {Injectable} from '@nestjs/common';
import type {FormDefinitionJson, FormAnswer, FormComputedJson, FormComputedScore} from '../../../domain/form-template/types';

@Injectable()
export class FormScoringService {
    /**
     * Computes scores and classifications from form answers based on the template definition.
     * Returns null if scoring is not enabled.
     */
    compute(definition: FormDefinitionJson, answers: FormAnswer[]): FormComputedJson | null {
        if (!definition.scoring?.enabled) return null;

        const answerMap = new Map(answers.map((a) => [a.fieldId, a]));
        const allFields = definition.sections.flatMap((s) => s.fields);
        const scores: FormComputedScore[] = [];
        let totalScore = 0;

        // Compute per-field scores
        for (const field of allFields) {
            if (!field.scoring || field.options === undefined) continue;
            const answer = answerMap.get(field.id);
            if (!answer || answer.valueText === undefined || answer.valueText === null) continue;

            const matchedOption = field.options.find((o) => o.value === answer.valueText);
            if (matchedOption?.score === undefined) continue;

            let score = matchedOption.score;
            if (field.scoring.reverseScore && field.options.length > 0) {
                const maxScore = Math.max(...field.options.map((o) => o.score ?? 0));
                score = maxScore - score;
            }

            const weight = field.scoring.weight ?? 1;
            const weightedScore = score * weight;
            totalScore += weightedScore;

            scores.push({
                fieldId: field.id,
                label: field.label,
                value: weightedScore,
            });
        }

        // Apply scoring rules for classification
        let classification: string | undefined;
        const flags: string[] = [];

        for (const rule of definition.scoring.rules ?? []) {
            const matched = rule.ranges.find(
                (r: {min: number; max: number; classification: string; flag?: string}) =>
                    totalScore >= r.min && totalScore <= r.max
            );
            if (matched) {
                classification = matched.classification;
                if (matched.flag) flags.push(matched.flag);
                break;
            }
        }

        return {
            totalScore,
            classification,
            flags: flags.length > 0 ? flags : undefined,
            scores,
        };
    }
}
