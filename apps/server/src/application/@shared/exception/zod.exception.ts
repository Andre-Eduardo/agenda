import type {ZodError} from 'zod';
import {ZodIssueCode} from 'zod';
import type {InputViolation} from '../../../domain/@shared/exceptions';

export function getViolations(error: ZodError): InputViolation[] {
    return error.issues.flatMap((issue) => {
        if (issue.code === ZodIssueCode.unrecognized_keys) {
            return issue.keys.map((key) => ({
                field: key,
                reason: 'Unrecognized key',
            }));
        }

        if (issue.code === ZodIssueCode.invalid_union) {
            return issue.unionErrors.flatMap((unionError) => getViolations(unionError));
        }

        return {
            field: issue.path.join('.'),
            reason: issue.message,
        };
    });
}
