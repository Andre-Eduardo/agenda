import type {Context, VariableIdType} from './context';

/**
 * Matches references in the format ${ref:type:path}
 * Examples:
 *   ${ref:id:user:john_doe}        → user ID keyed by 'john_doe'
 *   ${ref:id:professional:john}    → professional ID keyed by 'john'
 *   ${ref:var:contextId}           → context variable value
 */
const REFERENCE_REGEX = /\$\{ref:[^}]+\}/g;

/**
 * Resolves all ${ref:...} placeholders inside a string.
 * Non-string values pass through unchanged.
 */
export function resolveReferences(context: Context, value: string): string {
    return value.replace(REFERENCE_REGEX, (match) => {
        return String(resolveReference(context, match));
    });
}

/**
 * Resolves a single ${ref:...} reference token.
 */
function resolveReference(context: Context, reference: string): string | number | boolean {
    // Strip ${ and }
    const inner = reference.slice(2, -1);
    // Strip leading 'ref:'
    const withoutPrefix = inner.slice(4);
    const colonIndex = withoutPrefix.indexOf(':');

    if (colonIndex === -1) {
        throw new Error(`Malformed reference (missing type): "${reference}"`);
    }

    const referenceType = withoutPrefix.slice(0, colonIndex);
    const referencePath = withoutPrefix.slice(colonIndex + 1);

    switch (referenceType) {
        case 'id': {
            // Format: ref:id:<idType>:<key>
            // e.g.  ref:id:user:john_doe
            //       ref:id:professional:dr_house
            const idColonIndex = referencePath.indexOf(':');

            if (idColonIndex === -1) {
                throw new Error(`Malformed id reference (missing key): "${reference}"`);
            }

            const idType = referencePath.slice(0, idColonIndex) as VariableIdType;
            const key = referencePath.slice(idColonIndex + 1);

            return context.getVariableId(idType, key);
        }

        case 'var': {
            // Format: ref:var:<variableName>
            // e.g.  ref:var:contextId
            const varValue = (context.variables as Record<string, unknown>)[referencePath];

            if (varValue === undefined) {
                throw new Error(`Variable not found: "${referencePath}" in reference "${reference}"`);
            }

            return String(varValue);
        }

        default:
            throw new Error(`Unknown reference type "${referenceType}" in "${reference}"`);
    }
}

/**
 * Parses a raw cell value from a DataTable into a proper JS type.
 * Supports: null, booleans, numbers, JSON arrays/objects, and strings.
 * References (${ref:...}) are resolved against the context.
 */
export function parseValue(context: Context, raw: string): unknown {
    const resolved = resolveReferences(context, raw);

    if (resolved === 'null') return null;
    if (resolved === 'true') return true;
    if (resolved === 'false') return false;

    // Only coerce to number for plain numeric strings (no leading +, spaces, or non-numeric chars)
    // This prevents phone numbers like "+5511999990099" from becoming floats.
    if (/^-?\d+(\.\d+)?$/.test(resolved.trim())) return Number(resolved);

    // Try to parse JSON arrays/objects
    if ((resolved.startsWith('[') && resolved.endsWith(']')) || (resolved.startsWith('{') && resolved.endsWith('}'))) {
        try {
            return JSON.parse(resolved);
        } catch {
            // Not valid JSON — fall through to string
        }
    }

    return resolved;
}
