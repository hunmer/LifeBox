import { Router, Request, Response } from 'express';
import { asyncHandler } from '@/utils/error-handler.js';
import { getDatabase } from '@/database/connection.js';
import { z } from 'zod';

const router = Router();
const db = getDatabase();

// Validation schemas
const createEventSchema = z.object({
  type: z.string().min(1).max(100),
  data: z.any(),
  source: z.string().min(1).max(100),
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

  // Here you could also broadcast the event via WebSocket
  // await broadcastEvent(event);

  res.status(201).json({
    success: true,
    data: event,
    message: 'Event logged successfully',
  });
}));

export default router;