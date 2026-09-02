import { Module } from '@nestjs/common';
import { EventsModule } from './events/events.module.js';
import { UsersModule } from './users/users.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
@Module({
  imports: [EventsModule, UsersModule, NotificationsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
