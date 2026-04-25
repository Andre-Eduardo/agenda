import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import type {AddonDetail} from '../subscription.service';
import {ADDON_CATALOG, AddonCatalogEntry} from '../subscription-plans.config';
import {AddonGrantsTotalsDto, ActiveAddonDto} from './usage.dto';

@ApiSchema({name: 'AddonCatalogItem'})
export class AddonCatalogItemDto {
    @ApiProperty()
    code: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    priceMonthlyBrl: number;

    @ApiProperty({type: AddonGrantsTotalsDto})
    grants: AddonGrantsTotalsDto;

    constructor(code: string, entry: AddonCatalogEntry) {
        this.code = code;
        this.name = entry.name;
        this.priceMonthlyBrl = entry.priceMonthlyBrl;
        this.grants = new AddonGrantsTotalsDto(entry.grants);
    }
}

@ApiSchema({name: 'MemberActiveAddons'})
export class MemberActiveAddonsDto {
    @ApiProperty({format: 'uuid'})
    memberId: string;

    @ApiProperty({type: [ActiveAddonDto]})
    addons: ActiveAddonDto[];

    constructor(memberId: string, addons: AddonDetail[]) {
        this.memberId = memberId;
        this.addons = addons.map((a) => new ActiveAddonDto(a));
    }
}

export function buildAddonCatalogItems(): AddonCatalogItemDto[] {
    return Object.entries(ADDON_CATALOG).map(([code, entry]) => new AddonCatalogItemDto(code, entry));
}
