import 'dotenv/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  // Enable graceful shutdown (SIGTERM/SIGINT) for Nest, TypeORM, and BullMQ
  app.enableShutdownHooks();

  // Configure CORS
  const corsOrigin = configService.get<string>('app.corsOrigin');
  app.enableCors({
    origin: corsOrigin === '*' ? '*' : corsOrigin?.split(','),
  });

  app.useGlobalFilters(new GlobalExceptionFilter());

  // Conditional Swagger Setup
  const swaggerEnabled = configService.get<boolean>('app.swaggerEnabled');
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Fluxera API')
      .setDescription('API para crear, consultar, actualizar y procesar eventos.')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Eventos', 'Operaciones de creación, ciclo de vida y procesamiento de eventos')
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, swaggerDocument);
    logger.log('Swagger documentation is enabled at /api/docs');
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = configService.get<number>('app.port') ?? 3000;
  await app.listen(port);
  logger.log(`Fluxera application is running on port ${port}`);
}

await bootstrap();
