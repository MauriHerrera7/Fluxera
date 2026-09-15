import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EventStatus } from './enums/event-status.enum.js';
import { EventQueueService } from './event-queue.service.js';
import { EventsService } from './events.service.js';
import { EventRepository } from './repositories/event.repository.js';

describe('EventsService', () => {
  let service: EventsService;
  let currentStatus: EventStatus = EventStatus.PENDING;
  let currentPayload: Record<string, unknown> = { userId: '123' };
  const idempotencyStore = new Map<string, string>();
  const mockQueueService = {
    enqueueEvent: async (eventId: string) => ({ id: `job-${eventId}` }),
  };

  const mockRepository = {
    createEvent: async (eventData: { type: string; payload: Record<string, unknown>; status?: EventStatus }) => ({
      id: 'generated-id',
      type: eventData.type,
      payload: eventData.payload,
      status: eventData.status ?? EventStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    createEventWithIdempotency: async (
      eventData: { type: string; payload: Record<string, unknown>; status?: EventStatus },
      idempotencyKey: string,
    ) => {
      const existingId = idempotencyStore.get(idempotencyKey);

      if (existingId) {
        return {
          event: {
            id: existingId,
            type: eventData.type,
            payload: eventData.payload,
            status: eventData.status ?? EventStatus.PENDING,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          created: false,
        };
      }

      const generatedId = `event-${idempotencyStore.size + 1}`;
      idempotencyStore.set(idempotencyKey, generatedId);

      return {
        event: {
          id: generatedId,
          type: eventData.type,
          payload: eventData.payload,
          status: eventData.status ?? EventStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        created: true,
      };
    },
    findAll: async () => [
      {
        id: 'generated-id',
        type: 'user.created',
        payload: { userId: '123' },
        status: currentStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    findById: async (id: string) => {
      if (id === 'generated-id') {
        return {
          id: 'generated-id',
          type: 'user.created',
          payload: currentPayload,
          status: currentStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      return null;
    },
    update: async (id: string, eventData: { type?: string; payload?: Record<string, unknown>; status?: EventStatus }) => {
      if (id !== 'generated-id') {
        return null;
      }

      return {
        id: 'generated-id',
        type: eventData.type ?? 'user.created',
        payload: eventData.payload ?? { userId: '123' },
        status: eventData.status ?? currentStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
    updateStatus: async (id: string, status: EventStatus) => {
      if (id !== 'generated-id') {
        return null;
      }

      currentStatus = status;

      return {
        id: 'generated-id',
        type: 'user.created',
        payload: currentPayload,
        status,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
    remove: async () => undefined,
  };

  beforeEach(async () => {
    currentStatus = EventStatus.PENDING;
    currentPayload = { userId: '123' };
    idempotencyStore.clear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: EventRepository,
          useValue: mockRepository,
        },
        {
          provide: EventQueueService,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('should create an event and start as pending', async () => {
    const event = await service.create({
      type: 'user.created',
      data: { userId: '123' },
    }, 'abc-123');

    expect(event).toMatchObject({
      type: 'user.created',
      data: { userId: '123' },
      status: EventStatus.PENDING,
    });
    expect(event.id).toBeDefined();
  });

  it('should enqueue the event to be processed asynchronously', async () => {
    const event = await service.create({
      type: 'user.created',
      data: { userId: '456' },
    }, 'async-key');

    expect(event.status).toBe(EventStatus.PENDING);
    expect(event.id).toBeDefined();
  });

  it('should require an idempotency key for creation', async () => {
    await expect(
      service.create({
        type: 'user.created',
        data: { userId: '123' },
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reuse the original event for the same idempotency key', async () => {
    const first = await service.create({ type: 'user.created', data: { userId: '123' } }, 'same-key');
    const second = await service.create({ type: 'user.created', data: { userId: '456' } }, 'same-key');

    expect(second.id).toBe(first.id);
  });

  it('should create independent events for different idempotency keys', async () => {
    const first = await service.create({ type: 'user.created', data: { userId: '123' } }, 'key-a');
    const second = await service.create({ type: 'user.created', data: { userId: '456' } }, 'key-b');

    expect(second.id).not.toBe(first.id);
  });

  it('should transition PENDING to PROCESSING', async () => {
    const updated = await service.updateStatus('generated-id', EventStatus.PROCESSING);

    expect(updated.status).toBe(EventStatus.PROCESSING);
  });

  it('should transition PROCESSING to PROCESSED', async () => {
    currentStatus = EventStatus.PROCESSING;

    const updated = await service.updateStatus('generated-id', EventStatus.PROCESSED);

    expect(updated.status).toBe(EventStatus.PROCESSED);
  });

  it('should transition PROCESSING to FAILED', async () => {
    currentStatus = EventStatus.PROCESSING;

    const updated = await service.updateStatus('generated-id', EventStatus.FAILED);

    expect(updated.status).toBe(EventStatus.FAILED);
  });

  it('should keep retrying a failed event instead of completing the job', async () => {
    currentPayload = { shouldFail: true };

    await expect(service.processEvent('generated-id')).rejects.toThrow('Processing failed');
    expect(currentStatus).toBe(EventStatus.FAILED);

    await expect(service.processEvent('generated-id')).rejects.toThrow('Processing failed');
    expect(currentStatus).toBe(EventStatus.FAILED);
  });

  it('should reject invalid lifecycle transitions', async () => {
    await expect(service.updateStatus('generated-id', EventStatus.PENDING)).rejects.toThrow(BadRequestException);
  });

  it('should throw when updating status of a missing event', async () => {
    await expect(service.updateStatus('missing-id', EventStatus.PROCESSING)).rejects.toThrow(NotFoundException);
  });

  it('should return all events', async () => {
    const events = await service.findAll();

    expect(events).toHaveLength(1);
  });

  it('should return an existing event by id', async () => {
    const event = await service.findById('generated-id');

    expect(event).toMatchObject({
      id: 'generated-id',
      type: 'user.created',
      data: { userId: '123' },
    });
  });

  it('should throw when finding a missing event by id', async () => {
    await expect(service.findById('missing-id')).rejects.toThrow(NotFoundException);
  });

  it('should update only the fields sent in a partial update', async () => {
    const updated = await service.update('generated-id', {
      type: 'payment.updated',
    });

    expect(updated).toMatchObject({
      id: 'generated-id',
      type: 'payment.updated',
      data: { userId: '123' },
    });
  });

  it('should throw when updating a missing event', async () => {
    await expect(service.update('missing-id', { type: 'payment.updated' })).rejects.toThrow(NotFoundException);
  });

  it('should remove an existing event', async () => {
    await expect(service.remove('generated-id')).resolves.toBeUndefined();
  });

  it('should throw when removing a missing event', async () => {
    await expect(service.remove('missing-id')).rejects.toThrow(NotFoundException);
  });
});
