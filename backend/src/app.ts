import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from '@/utils/error-handler.js';
import { notFoundHandler } from '@/utils/not-found-handler.js';

// Import routes
import channelsRouter from '@/routes/channels.js';
import messagesRouter from '@/routes/messages.js';
import eventsRouter from '@/routes/events.js';
import healthRouter from '@/routes/health.js';

// Load environment variables
dotenv.config();

export function createApp() {
  const app = express();

  // Security middleware
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:1420',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));

  // Logging middleware
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
  }

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API routes
  app.use('/api/health', healthRouter);
  app.use('/api/channels', channelsRouter);
  app.use('/api/messages', messagesRouter);
  app.use('/api/events', eventsRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}

export default createApp;