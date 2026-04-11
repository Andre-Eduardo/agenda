import {Injectable} from '@nestjs/common';
import {InvalidInputException} from '../../../domain/@shared/exceptions';
import type {FormDefinitionJson, FormFieldDefinition, FormAnswer} from '../../../domain/form-template/types';

export type ValidationInput = {
    definition: FormDefinitionJson;
    answers: FormAnswer[];
};

@Injectable()
export class FormResponseValidatorService {
    /**
     * Validates form answers against the template definition.
     * Throws InvalidInputException with all violations if invalid.
     */
    validate({definition, answers}: ValidationInput): void {
        const violations: Array<{field: string; reason: string}> = [];
        const allFields = this.collectAllFields(definition);
        const answerMap = new Map(answers.map((a) => [a.fieldId, a]));
        const knownFieldIds = new Set(allFields.map((f) => f.id));

        // Check for unknown fields
        for (const answer of answers) {
            if (!knownFieldIds.has(answer.fieldId)) {
                violations.push({
                    field: answer.fieldId,
                    reason: `Unknown field "${answer.fieldId}" — not present in template definition.`,
                });
            }
        }

        // Validate each field
        for (const field of allFields) {
            const answer = answerMap.get(field.id);
            const fieldViolations = this.validateField(field, answer);
            violations.push(...fieldViolations);
        }

        if (violations.length > 0) {
            throw new InvalidInputException('Form response validation failed.', violations);
        }
    }

    private collectAllFields(definition: FormDefinitionJson): FormFieldDefinition[] {
        return definition.sections.flatMap((section) => section.fields);
    }

    private validateField(
        field: FormFieldDefinition,
        answer: FormAnswer | undefined
    ): Array<{field: string; reason: string}> {
        const violations: Array<{field: string; reason: string}> = [];

        if (field.required && !this.hasValue(answer)) {
            violations.push({field: field.id, reason: `Field "${field.label}" is required.`});
            return violations; // No point validating further if missing
        }

        if (!answer || !this.hasValue(answer)) return violations;

        // Type-specific validation
        switch (field.type) {
            case 'number':
            case 'score': {
                if (answer.valueNumber === undefined || answer.valueNumber === null) {
                    violations.push({field: field.id, reason: `Field "${field.label}" must be a number.`});
                    break;
                }
                if (field.validation?.min !== undefined && answer.valueNumber < field.validation.min) {
                    violations.push({
                        field: field.id,
                        reason: `Field "${field.label}" must be >= ${field.validation.min}.`,
                    });
                }
                if (field.validation?.max !== undefined && answer.valueNumber > field.validation.max) {
                    violations.push({
                        field: field.id,
                        reason: `Field "${field.label}" must be <= ${field.validation.max}.`,
                    });
                }
                break;
            }
            case 'text':
            case 'textarea': {
                if (typeof answer.valueText !== 'string') {
                    violations.push({field: field.id, reason: `Field "${field.label}" must be text.`});
                    break;
                }
                if (field.validation?.minLength !== undefined && answer.valueText.length < field.validation.minLength) {
                    violations.push({
                        field: field.id,
                        reason: `Field "${field.label}" must have at least ${field.validation.minLength} characters.`,
                    });
                }
                if (field.validation?.maxLength !== undefined && answer.valueText.length > field.validation.maxLength) {
                    violations.push({
                        field: field.id,
                        reason: `Field "${field.label}" must have at most ${field.validation.maxLength} characters.`,
                    });
                }
                break;
            }
            case 'select':
            case 'radio': {
                if (!field.options || field.options.length === 0) break;
                const validValues = field.options.map((o) => o.value);
                if (!validValues.includes(answer.valueText ?? '')) {
                    violations.push({
                        field: field.id,
                        reason: `Field "${field.label}" must be one of: ${validValues.join(', ')}.`,
                    });
                }
                break;
            }
            case 'multiselect':
            case 'checkbox': {
                if (!field.options || field.options.length === 0) break;
                const validValues = field.options.map((o) => o.value);
                const selected = Array.isArray(answer.valueJson) ? answer.valueJson : [];
                for (const val of selected) {
                    if (!validValues.includes(val as string)) {
                        violations.push({
                            field: field.id,
                            reason: `Field "${field.label}" contains invalid option: "${val}".`,
                        });
                    }
                }
                break;
            }
            case 'boolean': {
                if (answer.valueBoolean === undefined || answer.valueBoolean === null) {
                    violations.push({field: field.id, reason: `Field "${field.label}" must be boolean.`});
                }
                break;
            }
            case 'date':
            case 'datetime': {
                if (!answer.valueDate) {
                    violations.push({field: field.id, reason: `Field "${field.label}" must be a date.`});
                }
                break;
            }
        }

        return violations;
    }

    private hasValue(answer: FormAnswer | undefined): boolean {
        if (!answer) return false;
        return (
            answer.valueText !== null && answer.valueText !== undefined ||
            answer.valueNumber !== null && answer.valueNumber !== undefined ||
            answer.valueBoolean !== null && answer.valueBoolean !== undefined ||
            answer.valueDate !== null && answer.valueDate !== undefined ||
            answer.valueJson !== null && answer.valueJson !== undefined
        );
    }
}
