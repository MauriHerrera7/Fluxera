import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class EventQueueService {
  constructor(@InjectQueue('events') private readonly eventsQueue: Queue) {}

  async enqueueEvent(eventId: string): Promise<void> {
    await this.eventsQueue.add(
      'process-event',
      { eventId },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
}
