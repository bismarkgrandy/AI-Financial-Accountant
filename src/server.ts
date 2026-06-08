import app from './app';
import { env } from '@/config/env';
import logger from '@/utils/logger';
import prisma from '@/config/database';

const port = parseInt(env.PORT, 10);

const server = app.listen(port, () => {
  logger.info(`Server running on port ${port} in ${env.NODE_ENV} mode`);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Database disconnected. Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default server;
