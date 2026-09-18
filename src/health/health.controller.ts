import { Controller, Get } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { Queue } from 'bullmq';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly typeOrmHealth: TypeOrmHealthIndicator,
    @InjectQueue('events') private readonly eventsQueue: Queue,
  ) {}

  @Get()
  @HealthCheck()
  async getHealth() {
    return this.health.check([
      () => this.typeOrmHealth.pingCheck('database'),
      async () => {
        try {
          const client = (await (this.eventsQueue as unknown as { client: Promise<{ ping: () => Promise<string> }> }).client);
          const result = await client.ping();

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
        }
      },
    ]);
  }
}
