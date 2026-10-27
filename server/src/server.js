import { createApp } from './app.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';

const app = createApp();
const PORT = config.port || 5000;

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`TeamFlow API server listening on http://0.0.0.0:${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});
