import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async notifyEventProcessed(eventId: string, eventType: string): Promise<void> {
    this.logger.log(`[NOTIFICATION] Successfully processed event: ${eventId} of type ${eventType}`);
    
  }

  async notifyEventFailed(eventId: string, eventType: string, error?: string): Promise<void> {
    this.logger.warn(`[NOTIFICATION] Failed to process event: ${eventId} of type ${eventType}. Reason: ${error || 'Unknown'}`);
  }
}
