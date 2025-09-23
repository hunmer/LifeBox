import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from '@/utils/error-handler.js';
import { notFoundHandler } from '@/utils/not-found-handler.js';
import { HTTPRouterService } from '@/services/http-router.service.js';

// Import routes
import channelsRouter from '@/routes/channels.js';
import messagesRouter from '@/routes/messages.js';
import eventsRouter from '@/routes/events.js';
import healthRouter from '@/routes/health.js';
import pluginFilesRouter from '@/routes/plugin-files.js';
import staticRouter from '@/routes/static.js';

// Load environment variables
dotenv.config();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  // Static file serving
  app.use('/public', staticRouter);

  // Initialize HTTP Router Service
  const httpRouter = new HTTPRouterService(app);

  // Make httpRouter available globally for plugins
  (app as any).httpRouter = httpRouter;

  // API routes
  app.use('/api/health', healthRouter);
  app.use('/api/channels', channelsRouter);
  app.use('/api/messages', messagesRouter);
  app.use('/api/events', eventsRouter);

  // Keep plugin files API for downloads only
  app.use('/api/plugins', pluginFilesRouter);

  // Register test route for HTTP router system
  if (process.env.NODE_ENV === 'development') {
    httpRouter.register('test', [], [
      {
        url: 'hello',
        method: 'GET',
        callback: () => ({
          code: 200,
          json: { message: 'Hello from dynamic HTTP router!', timestamp: new Date().toISOString() }
        })
      }
    ]);
  }

  // 404 handler
  app.use(notFoundHandler);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}

// Create and export app instance for testing
export const app = createApp();

export default createApp;