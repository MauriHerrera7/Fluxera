import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventIdempotencyKeyEntity } from './events/entities/event-idempotency-key.entity.js';
import { EventEntity } from './events/entities/event.entity.js';
import { EventsModule } from './events/events.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { UsersModule } from './users/users.module.js';

const shouldUseDatabase = Boolean(process.env.DATABASE_HOST);

const postgresConfig = shouldUseDatabase
  ? {
      type: 'postgres' as const,
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT ?? 5432),
      username: process.env.DATABASE_USERNAME ?? 'postgres',
      password: process.env.DATABASE_PASSWORD ?? 'postgres',
      database: process.env.DATABASE_NAME ?? 'fluxera',
      entities: [EventEntity, EventIdempotencyKeyEntity],
      synchronize: false,
      migrations: ['dist/database/migrations/*.js'],
      migrationsRun: false,
      logging: process.env.NODE_ENV === 'development',
    }
  : null;

@Module({
  imports: [
    ...(postgresConfig ? [TypeOrmModule.forRoot(postgresConfig)] : []),
    EventsModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
