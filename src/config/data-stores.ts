export type DatabaseConnection = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
};

export type RedisConnection = {
  host: string;
  port: number;
  username?: string;
  password?: string;
  tls?: object;
};

export function resolveDatabaseConnection(): DatabaseConnection {
  const url = process.env.DATABASE_URL;

  if (url) {
    const parsed = new URL(url);
    const sslMode = parsed.searchParams.get('sslmode');

    return {
      host: parsed.hostname,
      port: Number(parsed.port || 5432),
      username: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
      ssl: sslMode !== 'disable',
    };
  }

  return {
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 5432),
    username: process.env.DATABASE_USERNAME ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? 'postgres',
    database: process.env.DATABASE_NAME ?? 'fluxera',
    ssl: process.env.DATABASE_SSL === 'true',
  };
}

export function resolveRedisConnection(): RedisConnection {
  const url = process.env.REDIS_URL;

  if (url) {
    const parsed = new URL(url);
    const password = parsed.password ? decodeURIComponent(parsed.password) : undefined;
    const username = parsed.username ? decodeURIComponent(parsed.username) : undefined;

    return {
      host: parsed.hostname,
      port: Number(parsed.port || 6379),
      username: username && username !== 'default' ? username : undefined,
      password,
      tls: parsed.protocol === 'rediss:' ? {} : undefined,
    };
  }

  return {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  };
}

export function redisClientOptions() {
  const redis = resolveRedisConnection();

  return {
    host: redis.host,
    port: redis.port,
    username: redis.username,
    password: redis.password,
    ...(redis.tls ? { tls: redis.tls } : {}),
    maxRetriesPerRequest: null,
  };
}
