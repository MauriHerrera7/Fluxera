import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EventsService } from '../events.service.js';

@Processor('events')
export class EventProcessor extends WorkerHost {
  private readonly logger = new Logger(EventProcessor.name);

  constructor(private readonly eventsService: EventsService) {
    super();
  }

  async process(job: Job<{ eventId: string }>): Promise<void> {
    this.logger.log(`Starting event processing job ${job.id} for event ${job.data.eventId}`);

    try {
      await this.eventsService.processEvent(job.data.eventId);
      this.logger.log(`Event processing job ${job.id} completed for event ${job.data.eventId}`);
    } catch (error) {
      this.logger.error(
        `Event processing job ${job.id} failed for event ${job.data.eventId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
