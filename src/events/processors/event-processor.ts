import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EventsService } from '../events.service.js';

@Processor('events')
export class EventProcessor extends WorkerHost {
  constructor(private readonly eventsService: EventsService) {
    super();
  }

  async process(job: Job<{ eventId: string }>): Promise<void> {
    await this.eventsService.processEvent(job.data.eventId);
  }
}
