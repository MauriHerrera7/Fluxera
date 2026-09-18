import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventIdempotencyKeyEntity } from './entities/event-idempotency-key.entity.js';
import { EventEntity } from './entities/event.entity.js';
import { EventProcessor } from './processors/event-processor.js';
import { EventQueueService } from './event-queue.service.js';
import { EventsController } from './events.controller.js';
import { EventsService } from './events.service.js';
import { EventRepository } from './repositories/event.repository.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventEntity, EventIdempotencyKeyEntity]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host') ?? 'localhost',
          port: configService.get<number>('redis.port') ?? 6379,
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'events',
    }),
  ],
  controllers: [EventsController],
  providers: [EventsService, EventRepository, EventQueueService, EventProcessor],
})
export class EventsModule {}
