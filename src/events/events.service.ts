import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { EventStatus, isValidEventStatusTransition } from './enums/event-status.enum.js';
import { EventQueueService } from './event-queue.service.js';
import { EventRepository } from './repositories/event.repository.js';

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
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly eventQueueService: EventQueueService,
  ) {}

  async create(dto: CreateEventDto, idempotencyKey?: string): Promise<EventResponse> {
    const key = idempotencyKey?.trim();

    if (!key) {
      throw new BadRequestException('Idempotency-Key header is required to create an event.');
    }

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
    }

    return toResponse(event);
  }

  async findAll(): Promise<EventResponse[]> {
    const events = await this.eventRepository.findAll();

    return events.map(toResponse);
  }

  async findById(id: string): Promise<EventResponse> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    return toResponse(event);
  }

  async update(id: string, dto: UpdateEventDto): Promise<EventResponse> {
    await this.findById(id);

    const updatedEvent = await this.eventRepository.update(id, {
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.data !== undefined ? { payload: dto.data } : {}),
    });

    if (!updatedEvent) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    return toResponse(updatedEvent);
  }

  async updateStatus(id: string, nextStatus: EventStatus): Promise<EventResponse> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    if (!isValidEventStatusTransition(event.status, nextStatus)) {
      throw new BadRequestException(
        `Invalid event status transition from ${event.status} to ${nextStatus}`,
      );
    }

    const updatedEvent = await this.eventRepository.updateStatus(id, nextStatus);

    if (!updatedEvent) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    return toResponse(updatedEvent);
  }

  async processEvent(eventId: string): Promise<EventResponse> {
    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw new NotFoundException(`Event with id ${eventId} not found`);
    }

    if (event.status !== EventStatus.PENDING && event.status !== EventStatus.FAILED) {
      return toResponse(event);
    }

    await this.updateStatus(eventId, EventStatus.PROCESSING);

    try {
      await this.executeEventProcessing(event);
      const processedEvent = await this.updateStatus(eventId, EventStatus.PROCESSED);
      return processedEvent;
    } catch (error) {
      await this.updateStatus(eventId, EventStatus.FAILED);
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
  }
}
