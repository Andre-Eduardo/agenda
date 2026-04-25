import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import type {CurrentUsageResult} from '../subscription.service';
import {PLAN_LIMITS} from '../subscription-plans.config';

export class UsageMetricDto {
    @ApiProperty()
    used: number;

    @ApiProperty({nullable: true, description: 'null = unlimited'})
    limit: number | null;

    @ApiProperty({description: 'Percentage of limit used (0–100). 0 when limit is null.'})
    percent: number;

    @ApiProperty({nullable: true, description: 'null = unlimited'})
    remaining: number | null;

    constructor(props: UsageMetricDto) {
        this.used = props.used;
        this.limit = props.limit;
        this.percent = props.percent;
        this.remaining = props.remaining;
    }
}

export class UsagePeriodDto {
    @ApiProperty()
    year: number;

    @ApiProperty()
    month: number;

    constructor(props: UsagePeriodDto) {
        this.year = props.year;
        this.month = props.month;
    }
}

export class UsageBreakdownDto {
    @ApiProperty({type: UsageMetricDto})
    docs: UsageMetricDto;

    @ApiProperty({type: UsageMetricDto})
    chat: UsageMetricDto;

    @ApiProperty({type: UsageMetricDto})
    images: UsageMetricDto;

    @ApiProperty({type: UsageMetricDto})
    storageHotGb: UsageMetricDto;

    constructor(props: UsageBreakdownDto) {
        this.docs = props.docs;
        this.chat = props.chat;
        this.images = props.images;
        this.storageHotGb = props.storageHotGb;
    }
}

@ApiSchema({name: 'CurrentUsage'})
export class CurrentUsageDto {
    @ApiProperty({enum: Object.keys(PLAN_LIMITS)})
    planCode: string;

    @ApiProperty()
    planName: string;

    @ApiProperty({type: UsagePeriodDto})
    period: UsagePeriodDto;

    @ApiProperty({type: UsageBreakdownDto})
    usage: UsageBreakdownDto;

    @ApiProperty()
    isAnyLimitReached: boolean;

    @ApiProperty({description: 'Percentage threshold at which warnings are shown (default: 80)'})
    warningThreshold: number;

    @ApiProperty({type: [String], description: 'Metrics that have reached their limit'})
    limitsReached: string[];

    constructor(result: CurrentUsageResult) {
        this.planCode = result.planCode;
        this.planName = result.planName;
        this.period = new UsagePeriodDto(result.period);
        this.usage = new UsageBreakdownDto({
            docs: new UsageMetricDto(result.usage.docs),
            chat: new UsageMetricDto(result.usage.chat),
            images: new UsageMetricDto(result.usage.images),
            storageHotGb: new UsageMetricDto(result.usage.storageHotGb),
        });
        this.isAnyLimitReached = result.isAnyLimitReached;
        this.warningThreshold = result.warningThreshold;
        this.limitsReached = result.limitsReached;
    }
}

@ApiSchema({name: 'MemberUsageSummary'})
export class MemberUsageSummaryDto {
    @ApiProperty({format: 'uuid'})
    memberId: string;

    @ApiProperty({type: CurrentUsageDto})
    usage: CurrentUsageDto;

    constructor(memberId: string, result: CurrentUsageResult) {
        this.memberId = memberId;
        this.usage = new CurrentUsageDto(result);
    }
}
