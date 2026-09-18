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
import {
  ApiBody,
  ApiExtraModels,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { CreateEventDto } from './dto/create-event.dto.js';
import { EventResponseDto } from './dto/event-response.dto.js';
import { UpdateEventDto, UpdateEventStatusDto } from './dto/update-event.dto.js';
import { EventStatus } from './enums/event-status.enum.js';
import { EventsService } from './events.service.js';

@Controller('events')
@ApiTags('Events')
@ApiExtraModels(EventResponseDto)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Crear y poner un evento en cola' })
  @ApiHeader({
    name: 'Idempotency-Key',
    description: 'Clave obligatoria que evita duplicados; las claves repetidas reutilizan el evento existente.',
    required: true,
    example: 'order-created-12345',
  })
  @ApiBody({ type: CreateEventDto })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Evento aceptado para procesamiento asincrónico.',
    schema: {
      type: 'object',
      properties: {
        data: { $ref: getSchemaPath(EventResponseDto) },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Falta Idempotency-Key o el cuerpo de la solicitud es inválido.' })
  async create(
    @Body() dto: CreateEventDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const event = await this.eventsService.create(dto, idempotencyKey);
    return { data: event };
  }

  @Get()
  @ApiOperation({ summary: 'Listar eventos' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Eventos encontrados.', type: EventResponseDto, isArray: true })
  findAll() {
    return this.eventsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un evento por ID' })
  @ApiParam({ name: 'id', description: 'UUID del evento.', format: 'uuid', example: '8d7d8b3e-7a3d-4e41-9b4f-4b6c9c7b4e2a' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Evento encontrado.', type: EventResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Evento no encontrado.' })
  getById(@Param('id') id: string) {
    return this.eventsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un evento' })
  @ApiParam({ name: 'id', description: 'UUID del evento.', format: 'uuid', example: '8d7d8b3e-7a3d-4e41-9b4f-4b6c9c7b4e2a' })
  @ApiBody({ type: UpdateEventDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Evento actualizado.', type: EventResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'El cuerpo de la solicitud es inválido.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Evento no encontrado.' })
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Aplicar una transición del ciclo de vida' })
  @ApiParam({ name: 'id', description: 'UUID del evento.', format: 'uuid', example: '8d7d8b3e-7a3d-4e41-9b4f-4b6c9c7b4e2a' })
  @ApiBody({ type: UpdateEventStatusDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Estado del evento actualizado.', type: EventResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Estado o transición del ciclo de vida inválidos.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Evento no encontrado.' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateEventStatusDto) {
    return this.eventsService.updateStatus(id, dto.status as EventStatus);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un evento' })
  @ApiParam({ name: 'id', description: 'UUID del evento.', format: 'uuid', example: '8d7d8b3e-7a3d-4e41-9b4f-4b6c9c7b4e2a' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Evento eliminado.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Evento no encontrado.' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.eventsService.remove(id);
  }
}
