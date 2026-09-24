import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { EventStatus, isValidEventStatusTransition } from './enums/event-status.enum.js';
import { EventQueueService } from './event-queue.service.js';
import { EventRepository } from './repositories/event.repository.js';
import { NotificationsService } from '../notifications/notifications.service.js';

type EventResponse = {
  id: string;
  type: string;
  data: Record<string, unknown>;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
};

const toResponse = (event: {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}): EventResponse => ({
  id: event.id,
  type: event.type,
  data: event.payload,
  status: event.status,
  createdAt: event.createdAt,
  updatedAt: event.updatedAt,
});

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly eventRepository: EventRepository,
    private readonly eventQueueService: EventQueueService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateEventDto, idempotencyKey?: string): Promise<EventResponse> {
    const key = idempotencyKey?.trim();

    if (!key) {
      this.logger.warn('Event creation rejected because Idempotency-Key is missing');
      throw new BadRequestException('Idempotency-Key header is required to create an event.');
    }

    this.logger.log(`Creating event of type "${dto.type}" with idempotency key`);

    const result =
      (await this.eventRepository.createEventWithIdempotency?.(
        {
          type: dto.type,
          payload: dto.data,
          status: EventStatus.PENDING,
        },
        key,
      )) ?? {
        event: await this.eventRepository.createEvent({
          type: dto.type,
          payload: dto.data,
          status: EventStatus.PENDING,
        }),
        created: true,
      };

    const event = 'event' in result ? result.event : result;
    const created = !('event' in result) || result.created;

    if (created) {
      await this.eventQueueService.enqueueEvent(event.id);
      this.logger.log(`Event created and queued: ${event.id} (${event.type})`);
    } else {
      this.logger.log(`Event reused from idempotency key: ${event.id} (${event.type})`);
    }

    return toResponse(event);
  }

  async findAll(): Promise<EventResponse[]> {
    const events = await this.eventRepository.findAll();
    this.logger.log(`Fetched ${events.length} events`);

    return events.map(toResponse);
  }

  async findById(id: string): Promise<EventResponse> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      this.logger.warn(`Event lookup failed: ${id}`);
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    this.logger.log(`Fetched event: ${event.id} (${event.type})`);
    return toResponse(event);
  }

  async update(id: string, dto: UpdateEventDto): Promise<EventResponse> {
    await this.findById(id);

    const updatedEvent = await this.eventRepository.update(id, {
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.data !== undefined ? { payload: dto.data } : {}),
    });

    if (!updatedEvent) {
      this.logger.warn(`Event update failed: ${id}`);
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    this.logger.log(`Event updated: ${updatedEvent.id} (${updatedEvent.type})`);
    return toResponse(updatedEvent);
  }

  async updateStatus(id: string, nextStatus: EventStatus): Promise<EventResponse> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      this.logger.warn(`Event status update failed because event does not exist: ${id}`);
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    if (!isValidEventStatusTransition(event.status, nextStatus)) {
      this.logger.warn(
        `Invalid event status transition for ${id}: ${event.status} -> ${nextStatus}`,
      );
      throw new BadRequestException(
        `Invalid event status transition from ${event.status} to ${nextStatus}`,
      );
    }

    const updatedEvent = await this.eventRepository.updateStatus(id, nextStatus);

    if (!updatedEvent) {
      this.logger.warn(`Event status update failed after validation: ${id}`);
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    this.logger.log(`Event status changed: ${updatedEvent.id} ${event.status} -> ${updatedEvent.status}`);
    return toResponse(updatedEvent);
  }

  async processEvent(eventId: string): Promise<EventResponse> {
    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      this.logger.error(`Processing requested for missing event: ${eventId}`);
      throw new NotFoundException(`Event with id ${eventId} not found`);
    }

    if (event.status !== EventStatus.PENDING && event.status !== EventStatus.FAILED) {
      this.logger.log(`Skipping processing for event ${eventId} because status is ${event.status}`);
      return toResponse(event);
    }

    this.logger.log(`Processing event ${eventId} (${event.type})`);
    await this.updateStatus(eventId, EventStatus.PROCESSING);

    try {
      await this.executeEventProcessing(event);
      const processedEvent = await this.updateStatus(eventId, EventStatus.PROCESSED);
      this.logger.log(`Event processing completed: ${eventId} (${event.type})`);
      
      // Notify completion
      await this.notificationsService.notifyEventProcessed(eventId, event.type).catch((err) => {
        this.logger.error(`Failed to send processing notification for event ${eventId}`, err instanceof Error ? err.stack : undefined);
      });
      
      return processedEvent;
    } catch (error) {
      await this.updateStatus(eventId, EventStatus.FAILED);
      this.logger.error(
        `Event processing failed: ${eventId} (${event.type})`,
        error instanceof Error ? error.stack : undefined,
      );
      
      // Notify failure
      await this.notificationsService.notifyEventFailed(eventId, event.type, error instanceof Error ? error.message : String(error)).catch((err) => {
        this.logger.error(`Failed to send failure notification for event ${eventId}`, err instanceof Error ? err.stack : undefined);
      });
      
      throw error;
    }
  }

  private async executeEventProcessing(event: {
    id: string;
    type: string;
    payload: Record<string, unknown>;
    status: EventStatus;
  }): Promise<void> {
    const payload = event.payload as Record<string, unknown>;

    if (payload?.shouldFail === true || event.type === 'event.failed') {
      throw new Error(`Processing failed for event ${event.id}`);
    }
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.eventRepository.remove(id);
    this.logger.log(`Event removed: ${id}`);
  }
}
