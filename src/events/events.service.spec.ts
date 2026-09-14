import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service.js';
import { EventRepository } from './repositories/event.repository.js';

describe('EventsService', () => {
  let service: EventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventsService, EventRepository],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('should create an event', () => {
    const event = service.create({
      type: 'user.created',
      data: { userId: '123' },
    });

    expect(event).toMatchObject({
      type: 'user.created',
      data: { userId: '123' },
    });
    expect(event.id).toBeDefined();
  });

  it('should remove an existing event', () => {
    const event = service.create({
      type: 'user.deleted',
      data: { userId: '456' },
    });

    service.remove(event.id);

    expect(() => service.findById(event.id)).toThrow(NotFoundException);
  });

  it('should throw when removing a missing event', () => {
    expect(() => service.remove('missing-id')).toThrow(NotFoundException);
  });
});
