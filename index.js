import { Buffer } from 'buffer';
if (typeof global.SlowBuffer === 'undefined') {
  global.SlowBuffer = Buffer;
}

import mongoose from 'mongoose';
import logger from './src/core/config/logger.js';
import { app } from './src/app.js';
import { mongoURI, port } from './src/core/config/config.js';

async function start() {
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000,
      maxPoolSize: 50,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000
    });

    logger.info('MongoDB connected');
    logger.info('[mongo] connected to:', {
      host: mongoose.connection.host,
      db: mongoose.connection.name,
      readyState: mongoose.connection.readyState // 1
    });

    const server = app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });

    // Set server timeouts for long-running AI tasks
    server.timeout = 120000; // 2 minutes
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
  } catch (err) {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

start();
