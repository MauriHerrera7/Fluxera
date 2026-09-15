import { PartialType } from '@nestjs/mapped-types';
import { IsEnum } from 'class-validator';
import { EventStatus } from '../enums/event-status.enum.js';
import { CreateEventDto } from './create-event.dto.js';

export class UpdateEventDto extends PartialType(CreateEventDto) {}

export class UpdateEventStatusDto {
  @IsEnum(EventStatus)
  status: EventStatus;
}
