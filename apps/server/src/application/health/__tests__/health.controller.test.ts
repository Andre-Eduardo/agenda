import {ServiceUnavailableException} from '@nestjs/common';
import {mockDeep} from 'jest-mock-extended';
import type {PrismaProvider} from '../../../infrastructure/repository/prisma/prisma.provider';
import {HealthController} from '../health.controller';

describe('A health controller', () => {
    const prismaProvider = mockDeep<PrismaProvider>();
    const controller = new HealthController(prismaProvider);

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should report liveness without touching the database', () => {
        expect(controller.live()).toEqual({status: 'ok'});
        expect(prismaProvider.client.$queryRaw).not.toHaveBeenCalled();
    });

    it('should report readiness when the database answers', async () => {
        prismaProvider.client.$queryRaw.mockResolvedValue([{'?column?': 1}]);

        await expect(controller.ready()).resolves.toEqual({status: 'ok'});
        expect(prismaProvider.client.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should fail with 503 when the database does not answer', async () => {
        prismaProvider.client.$queryRaw.mockRejectedValue(new Error('connection refused'));

        await expect(controller.ready()).rejects.toThrow(ServiceUnavailableException);
    });
});
