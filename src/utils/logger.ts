import winston from 'winston';
import { env } from '@/config/env';

const { combine, timestamp, errors, json, prettyPrint, colorize, simple } =
  winston.format;

const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    env.NODE_ENV === 'production' ? json() : prettyPrint(),
  ),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), simple()),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

export default logger;
