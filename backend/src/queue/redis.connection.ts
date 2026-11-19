import type { ConnectionOptions } from 'bullmq';

/** BullMQ/ioredis options from env (local Docker or Upstash with TLS). */
export function redisConnectionFromEnv(): ConnectionOptions {
  const host = process.env.REDIS_HOST ?? 'localhost';
  const port = Number(process.env.REDIS_PORT ?? 6379);
  const password = process.env.REDIS_PASSWORD?.trim();

  const connection: ConnectionOptions = { host, port };
  if (password) {
    connection.password = password;
  }
  if (process.env.REDIS_TLS === 'true') {
    connection.tls = {};
  }
  return connection;
}