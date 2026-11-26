import {Controller, Get, HttpCode, HttpStatus, ServiceUnavailableException, VERSION_NEUTRAL} from '@nestjs/common';
import {ApiExcludeController} from '@nestjs/swagger';
import {Public} from '@application/@shared/auth/public.decorator';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';

export type HealthStatus = {
    status: 'ok';
};

/**
 * Liveness/readiness probe used by Docker and load balancers.
 *
 * - `GET /api/health/live`: the process is up and serving HTTP.
 * - `GET /api/health`: the process is up and the database answers.
 *
 * Kept out of the OpenAPI document on purpose: it is operational, not part of the product API.
 */
@ApiExcludeController()
@Controller({path: 'health', version: VERSION_NEUTRAL})
export class HealthController {
    constructor(private readonly prismaProvider: PrismaProvider) {}

    @Public()
    @Get('live')
    @HttpCode(HttpStatus.OK)
    live(): HealthStatus {
        return {status: 'ok'};
    }

    @Public()
    @Get()
    @HttpCode(HttpStatus.OK)
    async ready(): Promise<HealthStatus> {
        try {
            await this.prismaProvider.client.$queryRaw`SELECT 1`;
        } catch {
            throw new ServiceUnavailableException({code: 'DATABASE_UNAVAILABLE', message: 'Database unavailable.'});
        }

        return {status: 'ok'};
    }
}
