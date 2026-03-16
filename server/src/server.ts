import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import config from './config/config';
import { testConnection } from './config/db';
import logger from './config/logger';
import { startExpiryJob } from './jobs/bookingExpiry';

async function start(): Promise<void> {
  await testConnection();
  startExpiryJob();
  app.listen(config.port, () => {
  logger.info(`Server running on port ${Number(config.port)} in ${config.nodeEnv === 'production' ? 'production' : 'development'} mode`);
  });
}

start().catch((err: Error) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});
