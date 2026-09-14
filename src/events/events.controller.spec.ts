import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller.js';
import { EventsService } from './events.service.js';
import { EventRepository } from './repositories/event.repository.js';

describe('EventsController', () => {
  let controller: EventsController;
  let service: EventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [EventsService, EventRepository],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    service = module.get<EventsService>(EventsService);
  });

  it('should remove an existing event', () => {
    const event = service.create({
      type: 'invoice.created',
      data: { invoiceId: 'abc-123' },
    });

    expect(() => controller.remove(event.id)).not.toThrow();
    expect(() => service.findById(event.id)).toThrow(NotFoundException);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
