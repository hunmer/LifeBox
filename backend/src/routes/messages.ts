import { Router, Request, Response } from 'express';
import { asyncHandler } from '@/utils/error-handler.js';
import { getDatabase } from '@/database/connection.js';
import { z } from 'zod';

const router = Router();
const db = getDatabase();

// Validation schemas
const createMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  author: z.string().min(1).max(100),
  type: z.enum(['text', 'image', 'file']).default('text'),
  channelId: z.string(),
});

/**
 * GET /api/messages?channelId=xxx&limit=50&offset=0
 * Get messages for a channel
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const channelId = req.query.channelId as string;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  if (!channelId) {
    return res.status(400).json({
      success: false,
      error: { message: 'channelId is required' }
    });
  }

  const messages = await db.message.findMany({
    where: { channelId },
    orderBy: { timestamp: 'desc' },
    take: limit,
    skip: offset,
    include: {
      channel: {
        select: { id: true, name: true }
      }
    }
  });

  res.json({
    success: true,
    data: messages,
    pagination: {
      limit,
      offset,
      total: await db.message.count({ where: { channelId } })
    }
  });
}));

/**
 * POST /api/messages
 * Create new message
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createMessageSchema.parse(req.body);

  // Verify channel exists
  const channel = await db.channel.findUnique({
    where: { id: validatedData.channelId }
  });

  if (!channel) {
    return res.status(404).json({
      success: false,
      error: { message: 'Channel not found' }
    });
  }

  const message = await db.message.create({
    data: validatedData,
    include: {
      channel: {
        select: { id: true, name: true }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: message,
    message: 'Message created successfully',
  });
}));

/**
 * DELETE /api/messages/:id
 * Delete message
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const message = await db.message.findUnique({ where: { id } });
  if (!message) {
    return res.status(404).json({
      success: false,
      error: { message: 'Message not found' }
    });
  }

  await db.message.delete({ where: { id } });

  res.json({
    success: true,
    message: 'Message deleted successfully',
  });
}));

export default router;