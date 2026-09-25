import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { EventIdempotencyKeyEntity } from './entities/event-idempotency-key.entity.js';
import { EventEntity } from './entities/event.entity.js';
import { EventProcessor } from './processors/event-processor.js';
import { EventQueueService } from './event-queue.service.js';
import { EventsController } from './events.controller.js';
import { EventsService } from './events.service.js';
import { EventRepository } from './repositories/event.repository.js';
import { redisClientOptions } from '../config/data-stores.js';

@Module({
  imports: [
    AuthModule,
    NotificationsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([EventEntity, EventIdempotencyKeyEntity]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        connection: redisClientOptions(),
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
