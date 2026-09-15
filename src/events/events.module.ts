import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventIdempotencyKeyEntity } from './entities/event-idempotency-key.entity.js';
import { EventEntity } from './entities/event.entity.js';
import { EventProcessor } from './processors/event-processor.js';
import { EventQueueService } from './event-queue.service.js';
import { EventsController } from './events.controller.js';
import { EventsService } from './events.service.js';
import { EventRepository } from './repositories/event.repository.js';

const redisHost = process.env.REDIS_HOST ?? 'localhost';
const redisPort = Number(process.env.REDIS_PORT ?? 6379);

@Module({
  imports: [
    TypeOrmModule.forFeature([EventEntity, EventIdempotencyKeyEntity]),
    BullModule.forRoot({
      connection: {
        host: redisHost,
        port: redisPort,
      },
    }),
    BullModule.registerQueue({
      name: 'events',
    }),
  ],
  controllers: [EventsController],
  providers: [EventsService, EventRepository, EventQueueService, EventProcessor],
})
export class EventsModule {}
