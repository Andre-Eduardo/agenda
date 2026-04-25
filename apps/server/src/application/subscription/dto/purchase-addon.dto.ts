import {z} from 'zod';
import {createZodDto} from '../../@shared/validation/dto';
import {ADDON_CATALOG} from '../subscription-plans.config';

const addonCodes = Object.keys(ADDON_CATALOG) as [string, ...string[]];

export const purchaseAddonSchema = z.object({
    addonCode: z.enum(addonCodes),
    quantity: z.coerce.number().int().min(1),
});

export class PurchaseAddonDto extends createZodDto(purchaseAddonSchema) {}
