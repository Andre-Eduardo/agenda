import type {JsonObject, JsonValue} from 'type-fest';
import * as YAML from 'yaml';
import {z} from 'zod';
import type {EntityId} from '../../src/domain/@shared/entity/id';
import type {Context, VariableIdType} from './context';

const REFERENCE_REGEX = /\$\{(ref:.+?)}/g;

/**
 * Parses a value into the more appropriate type.
 *
 * Also resolves references in the value.
 *
 * @param context The scenario context.
 * @param value The value to parse.
 */
export function parseValue(context: Context, value: string): JsonValue {
    return YAML.parse(value, {
        reviver: (_, elementValue) => {
            if (typeof elementValue === 'string' && elementValue.match(REFERENCE_REGEX) !== null) {
                return resolveReference(context, elementValue);
            }

            return elementValue;
        },
    });
}

/**
 * Resolves references in a string.
 *
 * @param context The scenario context.
 * @param value The string to resolve inner references.
 */
export function resolveReferences(context: Context, value: string): string {
    return value.replace(REFERENCE_REGEX, (ref) => `${resolveReference(context, ref)}`);
}

/**
 * Resolves a reference to a value.
 *
 * The reference must be in the format `${ref:<type>:<path>}`.
 *
 * The supported reference types are:
 * - `id`: Resolves to an entity ID.
 * - `var`: Resolves to a value in the scenario variables.
 *
 * @param context The scenario context.
 * @param reference The reference to resolve.
 */
export function resolveReference(context: Context, reference: string): JsonValue {
    if (!reference.match(REFERENCE_REGEX)) {
        throw new Error('Invalid reference format.');
    }

    const value = reference.slice(6, -1);
    const [referenceType, ...referencePath] = value.split(':');

    switch (referenceType) {
        case 'id': {
            z.array(z.string()).min(1, 'identifier reference require an identifier type').parse(referencePath);

            return getIdentifier(context, referencePath[0], referencePath.slice(1)).toString();
        }

        case 'var':
            z.array(z.string()).length(1, 'reference to var takes a `.` separated json path').parse(referencePath);

            return getValueAt(context.variables, referencePath[0]);

        default:
            throw new Error(`Unknown reference type "${referenceType}".`);
    }
}

type IdParserOptions = {
    length: number;
    expectedFormat: string;
    generator: (context: Context, path: string[]) => EntityId<string>;
};

const idParser: Record<VariableIdType, IdParserOptions> = {
    user: {
        length: 1,
        expectedFormat: '<username>',
        generator: (context, [username]) => context.getVariableId('user', username),
    },
    company: {
        length: 1,
        expectedFormat: '<companyName>',
        generator: (context, [name]) => context.getVariableId('company', name),
    },
    room: {
        length: 2,
        expectedFormat: '<companyName>:<roomNumber>',
        generator: (context, [company, room]) => context.getVariableId('room', room, company),
    },
    roomCategory: {
        length: 2,
        expectedFormat: '<companyName>:<roomCategoryName>',
        generator: (context, [company, roomCategory]) => context.getVariableId('roomCategory', roomCategory, company),
    },
    reservation: {
        length: 3,
        expectedFormat: '<companyName>:[room | roomCategory]:[<roomNumber> | <roomCategoryName>]',
        generator: (context, [company, reservationType, identifier]) =>
            context.getVariableId('reservation', `${reservationType}.${identifier}`, company),
    },
    cashier: {
        length: 2,
        expectedFormat: '<companyName>:<cashierUsername>',
        generator: (context, [company, username]) => context.getVariableId('cashier', username, company),
    },
    customer: {
        length: 2,
        expectedFormat: '<companyName>:<customerDocumentId>',
        generator: (context, [company, documentId]) => context.getVariableId('customer', documentId, company),
    },
    directSale: {
        length: 2,
        expectedFormat: '<companyName>:<directSaleSellerName>',
        generator: (context, [company, sellerName]) => context.getVariableId('directSale', sellerName, company),
    },
    supplier: {
        length: 2,
        expectedFormat: '<companyName>:<supplierDocumentId>',
        generator: (context, [company, documentId]) => context.getVariableId('supplier', documentId, company),
    },
    employee: {
        length: 2,
        expectedFormat: '<companyName>:<employeeDocumentId>',
        generator: (context, [company, documentId]) => context.getVariableId('employee', documentId, company),
    },
    employeePosition: {
        length: 2,
        expectedFormat: '<companyName>:<employeePositionName>',
        generator: (context, [company, name]) => context.getVariableId('employeePosition', name, company),
    },
    paymentMethod: {
        length: 2,
        expectedFormat: '<companyName>:<paymentMethodName>',
        generator: (context, [company, name]) => context.getVariableId('paymentMethod', name, company),
    },
    transaction: {
        length: 3,
        expectedFormat: '<companyName>:<type>:<amount>',
        generator: (context, [company, type, amount]) =>
            context.getVariableId('transaction', `${type}.${amount}`, company),
    },
    product: {
        length: 2,
        expectedFormat: '<companyName>:<productCode>',
        generator: (context, [company, code]) => context.getVariableId('product', code, company),
    },
    productCategory: {
        length: 2,
        expectedFormat: '<companyName>:<productCategoryName>',
        generator: (context, [company, name]) => context.getVariableId('productCategory', name, company),
    },
    defectType: {
        length: 2,
        expectedFormat: '<companyName>:<defectTypeName>',
        generator: (context, [company, name]) => context.getVariableId('defectType', name, company),
    },
    defect: {
        length: 3,
        expectedFormat: '<companyName>:<roomNumber>:<defectTypeName>',
        generator: (context, [company, roomNumber, defectTypeName]) =>
            context.getVariableId('defect', `${roomNumber}.${defectTypeName}`, company),
    },
    service: {
        length: 2,
        expectedFormat: '<companyName>:<serviceCode>',
        generator: (context, [company, code]) => context.getVariableId('service', code, company),
    },
    serviceCategory: {
        length: 2,
        expectedFormat: '<companyName>:<serviceCategoryName>',
        generator: (context, [company, name]) => context.getVariableId('serviceCategory', name, company),
    },
    cleaning: {
        length: 2,
        expectedFormat: '<companyName>:<roomNumber>',
        generator: (context, [company, roomNumber]) => context.getVariableId('cleaning', roomNumber, company),
    },
    maintenance: {
        length: 2,
        expectedFormat: '<companyName>:<roomNumber>',
        generator: (context, [company, roomNumber]) => context.getVariableId('maintenance', roomNumber, company),
    },
    inspection: {
        length: 2,
        expectedFormat: '<companyName>:<inspectionRoomNumber>',
        generator: (context, [company, number]) => context.getVariableId('inspection', number, company),
    },
    blockade: {
        length: 2,
        expectedFormat: '<companyName>:<roomNumber>',
        generator: (context, [company, roomNumber]) => context.getVariableId('blockade', roomNumber, company),
    },
    deepCleaning: {
        length: 2,
        expectedFormat: '<companyName>:<roomNumber>',
        generator: (context, [company, roomNumber]) => context.getVariableId('deepCleaning', roomNumber, company),
    },
    account: {
        length: 2,
        expectedFormat: '<companyName>:<accountName>',
        generator: (context, [company, name]) => context.getVariableId('account', name, company),
    },
    audit: {
        length: 2,
        expectedFormat: '<companyName>:<roomNumber>',
        generator: (context, [company, id]) => context.getVariableId('audit', id, company),
    },
    stock: {
        length: 3,
        expectedFormat: '<companyName>:[room | hallway | other | main]:[<roomNumber> | <stockName> | <stockType>]',
        generator: (context, [company, stockType, identifier]) =>
            context.getVariableId('stock', `${stockType}.${identifier}`, company),
    },
};

function getIdentifier(context: Context, identifierType: string, identifierPath: string[]): EntityId<string> {
    if (!context.checkVariableIdType(identifierType)) {
        throw new Error(`Unknown identifier type: "${identifierType}".`);
    }

    const options = idParser[identifierType];

    z.array(z.string())
        .length(
            options.length,
            `${identifierType} identifier references must follow the format $\{ref:id:${identifierType}:${options.expectedFormat}}`
        )
        .parse(identifierPath);

    return options.generator(context, identifierPath);
}

function getValueAt(variables: JsonObject, path: string): JsonValue {
    const pathComponents = path.split('.');

    let current = variables;
    const currentPath = [];

    for (const fieldName of pathComponents) {
        currentPath.push(fieldName);

        if (current[fieldName] === undefined) {
            throw new Error(`No var at path "${currentPath.join('.')}".`);
        }

        current = current[fieldName] as JsonObject;
    }

    return current;
}
