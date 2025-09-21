import { Router, Request, Response } from 'express';
import { asyncHandler } from '@/utils/error-handler.js';
import { ChannelService } from '@/services/channel.service.js';
import { eventBus } from '@/events/event-bus.js';
import { z } from 'zod';

const router = Router();
const channelService = new ChannelService();

// Validation schemas
const createChannelSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const updateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
});

/**
 * GET /api/channels
 * Get all channels
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const channels = await channelService.getAllChannels();

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

  const channel = await channelService.getChannelWithMessageCount(id);

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

  try {
    const channel = await channelService.createChannel(validatedData);

    // Emit real-time event for new channel
    await eventBus.emitEvent('chat.channel.created', {
      channel
    }, 'api');

    res.status(201).json({
      success: true,
      data: channel,
      message: 'Channel created successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: { message: error.message }
      });
    }
    throw error;
  }
}));

/**
 * PUT /api/channels/:id
 * Update channel
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateChannelSchema.parse(req.body);

  try {
    const channel = await channelService.updateChannel(id, validatedData);

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: { message: 'Channel not found' }
      });
    }

    // Emit real-time event for channel update
    await eventBus.emitEvent('chat.channel.updated', {
      channel
    }, 'api');

    res.json({
      success: true,
      data: channel,
      message: 'Channel updated successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: { message: error.message }
      });
    }
    throw error;
  }
}));

/**
 * DELETE /api/channels/:id
 * Delete channel
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Get channel details before deletion for the event
  const channelBeforeDelete = await channelService.getChannelById(id);

  const success = await channelService.deleteChannel(id);

  if (!success) {
    return res.status(404).json({
      success: false,
      error: { message: 'Channel not found' }
    });
  }

  // Emit real-time event for channel deletion
  if (channelBeforeDelete) {
    await eventBus.emitEvent('chat.channel.deleted', {
      channelId: id,
      channelName: channelBeforeDelete.name
    }, 'api');
  }

  res.json({
    success: true,
    message: 'Channel deleted successfully',
  });
}));

export default router;