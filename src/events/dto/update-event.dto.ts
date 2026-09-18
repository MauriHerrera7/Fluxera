import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EventStatus } from '../enums/event-status.enum.js';
import { CreateEventDto } from './create-event.dto.js';

export class UpdateEventDto extends PartialType(CreateEventDto) {}

export class UpdateEventStatusDto {
  @ApiProperty({
    description: 'Siguiente estado del ciclo de vida del evento.',
    enum: EventStatus,
    example: EventStatus.PROCESSING,
  })
  @IsEnum(EventStatus)
  status: EventStatus;
}
