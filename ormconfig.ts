import 'dotenv/config';
import { DataSource } from 'typeorm';
import { resolveDatabaseConnection } from './src/config/data-stores.js';
import { EventIdempotencyKeyEntity } from './src/events/entities/event-idempotency-key.entity.js';
import { EventEntity } from './src/events/entities/event.entity.js';
import { UserEntity } from './src/users/entities/user.entity.js';

const database = resolveDatabaseConnection();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: database.host,
  port: database.port,
  username: database.username,
  password: database.password,
  database: database.database,
  ssl: database.ssl ? { rejectUnauthorized: true } : false,
  entities: [EventEntity, EventIdempotencyKeyEntity, UserEntity],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
