import { Router, Request, Response } from 'express';
import { asyncHandler } from '@/utils/error-handler.js';
import { getDatabase } from '@/database/connection.js';
import { z } from 'zod';

const router = Router();
const db = getDatabase();

// Validation schemas
const createChannelSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

/**
 * GET /api/channels
 * Get all channels
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const channels = await db.channel.findMany({
    include: {
      _count: {
        select: { messages: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: channels,
    total: channels.length,
  });
}));

/**
 * GET /api/channels/:id
 * Get channel by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const channel = await db.channel.findUnique({
    where: { id },
    include: {
      _count: {
        select: { messages: true }
      }
    }
  });

  if (!channel) {
    return res.status(404).json({
      success: false,
      error: { message: 'Channel not found' }
    });
  }

  res.json({
    success: true,
    data: channel,
  });
}));

/**
 * POST /api/channels
 * Create new channel
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createChannelSchema.parse(req.body);

  const channel = await db.channel.create({
    data: validatedData,
  });

  res.status(201).json({
    success: true,
    data: channel,
    message: 'Channel created successfully',
  });
}));

/**
 * DELETE /api/channels/:id
 * Delete channel
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const channel = await db.channel.findUnique({ where: { id } });
  if (!channel) {
    return res.status(404).json({
      success: false,
      error: { message: 'Channel not found' }
    });
  }

  await db.channel.delete({ where: { id } });

  res.json({
    success: true,
    message: 'Channel deleted successfully',
  });
}));

export default router;