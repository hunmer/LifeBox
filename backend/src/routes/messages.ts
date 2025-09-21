import { Router, Request, Response } from 'express';
import { asyncHandler } from '@/utils/error-handler.js';
import { MessageService } from '@/services/message.service.js';
import { eventBus } from '@/events/event-bus.js';
import { z } from 'zod';

const router = Router();
const messageService = new MessageService();

// Validation schemas
const createMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  author: z.string().min(1).max(100),
  type: z.enum(['text', 'image', 'file']).default('text'),
  channelId: z.string(),
});

const updateMessageSchema = z.object({
  content: z.string().min(1).max(2000).optional(),
  type: z.enum(['text', 'image', 'file']).optional(),
});

/**
 * GET /api/messages?channelId=xxx&limit=50&page=1
 * Get messages for a channel
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const channelId = req.query.channelId as string;
  const limit = parseInt(req.query.limit as string) || 50;
  const page = parseInt(req.query.page as string) || 1;

  if (!channelId) {
    return res.status(400).json({
      success: false,
      error: { message: 'channelId is required' }
    });
  }

  // Validate channel exists
  const channelExists = await messageService.validateChannelExists(channelId);
  if (!channelExists) {
    return res.status(404).json({
      success: false,
      error: { message: 'Channel not found' }
    });
  }

  const [messages, totalMessages] = await Promise.all([
    messageService.getMessagesByChannelIdPaginated(channelId, page, limit),
    messageService.getMessageCount(channelId)
  ]);

  res.json({
    success: true,
    data: messages,
    pagination: {
      limit,
      page,
      total: totalMessages,
      totalPages: Math.ceil(totalMessages / limit)
    }
  });
}));

/**
 * GET /api/messages/:id
 * Get message by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const message = await messageService.getMessageById(id);

  if (!message) {
    return res.status(404).json({
      success: false,
      error: { message: 'Message not found' }
    });
  }

  res.json({
    success: true,
    data: message,
  });
}));

/**
 * POST /api/messages
 * Create new message
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createMessageSchema.parse(req.body);

  try {
    const message = await messageService.createMessageWithValidation(validatedData);

    // Emit real-time event for new message
    await eventBus.emitEvent('chat.message.created', {
      message,
      channelId: message.channelId
    }, 'api');

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message created successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('does not exist')) {
      return res.status(404).json({
        success: false,
        error: { message: error.message }
      });
    }
    throw error;
  }
}));

/**
 * PUT /api/messages/:id
 * Update message
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateMessageSchema.parse(req.body);

  const message = await messageService.updateMessage(id, validatedData);

  if (!message) {
    return res.status(404).json({
      success: false,
      error: { message: 'Message not found' }
    });
  }

  // Emit real-time event for message update
  await eventBus.emitEvent('chat.message.updated', {
    message,
    channelId: message.channelId
  }, 'api');

  res.json({
    success: true,
    data: message,
    message: 'Message updated successfully',
  });
}));

/**
 * DELETE /api/messages/:id
 * Delete message
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Get message details before deletion for the event
  const messageBeforeDelete = await messageService.getMessageById(id);
  
  const success = await messageService.deleteMessage(id);

  if (!success) {
    return res.status(404).json({
      success: false,
      error: { message: 'Message not found' }
    });
  }

  // Emit real-time event for message deletion
  if (messageBeforeDelete) {
    await eventBus.emitEvent('chat.message.deleted', {
      messageId: id,
      channelId: messageBeforeDelete.channelId
    }, 'api');
  }

  res.json({
    success: true,
    message: 'Message deleted successfully',
  });
}));

export default router;