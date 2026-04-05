import pino from 'pino';

const transport =
  process.env.NODE_ENV !== 'production'
    ? pino.transport({ target: 'pino-pretty', options: { colorize: true } })
    : undefined;

export const logger = pino(
  { level: process.env.LOG_LEVEL ?? 'debug' },
  transport,
);
