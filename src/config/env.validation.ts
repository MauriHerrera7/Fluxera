import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().port().default(3000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  DATABASE_HOST: Joi.string().allow('').default('localhost'),
  DATABASE_PORT: Joi.number().port().default(5432),
  DATABASE_USERNAME: Joi.string().allow('').default('postgres'),
  DATABASE_PASSWORD: Joi.string().allow('').default('postgres'),
  DATABASE_NAME: Joi.string().allow('').default('fluxera'),
  REDIS_HOST: Joi.string().allow('').default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
}).unknown(true);
