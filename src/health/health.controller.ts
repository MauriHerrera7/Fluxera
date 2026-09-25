import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { redisClientOptions } from '../config/data-stores.js';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly typeOrmHealth: TypeOrmHealthIndicator,
  ) {}

  @Get('liveness')
  @HealthCheck()
  getLiveness() {
    return this.health.check([
      () => ({ application: { status: 'up' } })
    ]);
  }

  @Get('readiness')
  @HealthCheck()
  async getReadiness() {
    return this.health.check([
      () => this.typeOrmHealth.pingCheck('database'),
      async () => {
        const RedisCtor = (await import('ioredis')).default as any;

        const redis = new RedisCtor({
          ...redisClientOptions(),
          lazyConnect: true,
        });

        try {
          const result = await redis.ping();

          return {
            redis: {
              status: result === 'PONG' ? 'up' : 'down',
            },
          };
        } catch {
          return {
            redis: {
              status: 'down',
            },
          };
        } finally {
          await redis.quit();
        }
      },
    ]);
  }
}
