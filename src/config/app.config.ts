import { registerAs } from '@nestjs/config';
import { resolveDatabaseConnection, resolveRedisConnection } from './data-stores.js';

export const appConfig = registerAs('app', () => ({
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  swaggerEnabled: process.env.SWAGGER_ENABLED === 'true' || process.env.SWAGGER_ENABLED === undefined,
}));

export const databaseConfig = registerAs('database', () => resolveDatabaseConnection());

export const redisConfig = registerAs('redis', () => resolveRedisConnection());
