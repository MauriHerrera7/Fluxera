import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto, UpdateEventStatusDto } from './dto/update-event.dto.js';
import { EventStatus } from './enums/event-status.enum.js';
import { EventsService } from './events.service.js';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async create(
    @Body() dto: CreateEventDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const event = await this.eventsService.create(dto, idempotencyKey);
    return { data: event };
  }

  @Get()
  findAll() {
    return this.eventsService.findAll();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.eventsService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateEventStatusDto) {
    return this.eventsService.updateStatus(id, dto.status as EventStatus);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.eventsService.remove(id);
  }
}
