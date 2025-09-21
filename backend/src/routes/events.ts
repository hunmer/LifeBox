import { Router, Request, Response } from 'express';
import { asyncHandler } from '@/utils/error-handler.js';
import { getDatabase } from '@/database/connection.js';
import { eventBus } from '@/events/event-bus.js';
import { z } from 'zod';

const router = Router();
const db = getDatabase();

// Validation schemas
const createEventSchema = z.object({
  type: z.string().min(1).max(100),
  data: z.any(),
  source: z.string().min(1).max(100),
  metadata: z.record(z.any()).optional(),
});

const pluginHandlerSchema = z.object({
  pluginId: z.string().min(1).max(100),
  eventTypes: z.array(z.string().min(1)),
  priority: z.number().optional(),
});

/**
 * GET /api/events
 * Get events (for debugging/monitoring)
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const offset = parseInt(req.query.offset as string) || 0;
  const type = req.query.type as string;

  const where = type ? { type } : {};

  const events = await db.event.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: limit,
    skip: offset,
  });

  res.json({
    success: true,
    data: events,
    pagination: {
      limit,
      offset,
      total: await db.event.count({ where })
    }
  });
}));

/**
 * POST /api/events
 * Create/log new event
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createEventSchema.parse(req.body);

  const event = await db.event.create({
    data: {
      ...validatedData,
      data: JSON.stringify(validatedData.data),
    }
  });

  // Broadcast the event via EventBus and WebSocket
  await eventBus.emitEvent(validatedData.type, validatedData.data, validatedData.source, validatedData.metadata);

  res.status(201).json({
    success: true,
    data: event,
    message: 'Event logged and broadcasted successfully',
  });
}));

/**
 * GET /api/events/history
 * Get event history from EventBus
 */
router.get('/history', asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const eventType = req.query.type as string;

  const history = eventBus.getEventHistory(limit, eventType);

  res.json({
    success: true,
    data: history,
    count: history.length,
  });
}));

/**
 * GET /api/events/stats
 * Get EventBus statistics
 */
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const stats = eventBus.getStats();

  res.json({
    success: true,
    data: stats,
  });
}));

/**
 * POST /api/events/emit
 * Emit event directly to EventBus (for debugging/testing)
 */
router.post('/emit', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createEventSchema.parse(req.body);

  // Emit event without logging to database
  await eventBus.emitEvent(validatedData.type, validatedData.data, validatedData.source, validatedData.metadata);

  res.status(200).json({
    success: true,
    message: 'Event emitted successfully',
  });
}));

/**
 * POST /api/events/plugins/register
 * Register plugin event handler
 */
router.post('/plugins/register', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = pluginHandlerSchema.parse(req.body);

  // Create a mock handler for testing (in real implementation, this would come from the plugin)
  const handler = async (payload: any) => {
    console.log(`🔌 Plugin ${validatedData.pluginId} received event:`, payload);
  };

  eventBus.registerPluginHandler({
    pluginId: validatedData.pluginId,
    eventTypes: validatedData.eventTypes,
    handler,
    priority: validatedData.priority,
  });

  res.status(200).json({
    success: true,
    message: `Plugin handler registered for ${validatedData.pluginId}`,
  });
}));

/**
 * DELETE /api/events/plugins/:pluginId
 * Unregister plugin event handler
 */
router.delete('/plugins/:pluginId', asyncHandler(async (req: Request, res: Response) => {
  const pluginId = req.params.pluginId;

  eventBus.unregisterPluginHandler(pluginId);

  res.status(200).json({
    success: true,
    message: `Plugin handler unregistered for ${pluginId}`,
  });
}));

/**
 * DELETE /api/events/history
 * Clear event history
 */
router.delete('/history', asyncHandler(async (req: Request, res: Response) => {
  eventBus.clearHistory();

  res.status(200).json({
    success: true,
    message: 'Event history cleared',
  });
}));

export default router;