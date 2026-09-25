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
    const { eventId } = job.data;
    const attempt = job.attemptsMade + 1;
    const maxAttempts = job.opts.attempts ?? 1;
    const isLastAttempt = attempt >= maxAttempts;

    const start = Date.now();
    this.logger.log(`Processing event ${eventId} (job ${job.id}, attempt ${attempt}/${maxAttempts})`);

    try {
      await this.eventsService.processEvent(eventId, isLastAttempt);
      const duration = Date.now() - start;
      this.logger.log(`Event ${eventId} processed successfully in ${duration}ms (job ${job.id})`);
    } catch (error) {
      const duration = Date.now() - start;
      this.logger.error(
        `Event ${eventId} failed in ${duration}ms (job ${job.id}, attempt ${attempt}/${maxAttempts}${isLastAttempt ? ', final' : ', will retry'})`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
