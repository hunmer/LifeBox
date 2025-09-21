import { PrismaClient, Channel, Prisma } from '@prisma/client';
import { z } from 'zod';

// Validation schemas
const channelCreateSchema = z.object({
  name: z.string()
    .min(1, 'Channel name cannot be empty')
    .max(255, 'Channel name too long')
    .regex(/^[a-z0-9-_]+$/, 'Channel name can only contain lowercase letters, numbers, hyphens, and underscores')
    .refine(name => !name.startsWith('_'), 'Channel name cannot start with underscore'),
  description: z.string().max(1000, 'Description too long').optional(),
});

const channelUpdateSchema = z.object({
  name: z.string()
    .min(1, 'Channel name cannot be empty')
    .max(255, 'Channel name too long')
    .regex(/^[a-z0-9-_]+$/, 'Channel name can only contain lowercase letters, numbers, hyphens, and underscores')
    .refine(name => !name.startsWith('_'), 'Channel name cannot start with underscore')
    .optional(),
  description: z.string().max(1000, 'Description too long').nullable().optional(),
});

export type ChannelCreateInput = z.infer<typeof channelCreateSchema>;
export type ChannelUpdateInput = z.infer<typeof channelUpdateSchema>;

export class ChannelModel {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Create a new channel
   */
  async create(data: ChannelCreateInput): Promise<Channel> {
    // Validate input data
    const validatedData = channelCreateSchema.parse(data);

    try {
      const channel = await this.prisma.channel.create({
        data: validatedData,
      });

      return channel;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error(`Channel with name '${validatedData.name}' already exists`);
        }
      }
      throw error;
    }
  }

  /**
   * Find channel by ID
   */
  async findById(id: string): Promise<Channel | null> {
    try {
      const channel = await this.prisma.channel.findUnique({
        where: { id },
      });

      return channel;
    } catch (error) {
      return null;
    }
  }

  /**
   * Find channel by name
   */
  async findByName(name: string): Promise<Channel | null> {
    try {
      const channel = await this.prisma.channel.findUnique({
        where: { name },
      });

      return channel;
    } catch (error) {
      return null;
    }
  }

  /**
   * Find all channels
   */
  async findAll(): Promise<Channel[]> {
    try {
      const channels = await this.prisma.channel.findMany({
        orderBy: { createdAt: 'asc' },
      });

      return channels;
    } catch (error) {
      return [];
    }
  }

  /**
   * Update channel
   */
  async update(id: string, data: ChannelUpdateInput): Promise<Channel | null> {
    // Validate input data
    const validatedData = channelUpdateSchema.parse(data);

    try {
      const channel = await this.prisma.channel.update({
        where: { id },
        data: validatedData,
      });

      return channel;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // Record not found
          return null;
        }
        if (error.code === 'P2002') {
          throw new Error(`Channel with name '${validatedData.name}' already exists`);
        }
      }
      throw error;
    }
  }

  /**
   * Delete channel by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.channel.delete({
        where: { id },
      });

      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // Record not found
          return false;
        }
      }
      return false;
    }
  }

  /**
   * Get member count for a channel
   * Note: This is a placeholder implementation as we don't have user/member models yet
   */
  async getMemberCount(channelId: string): Promise<number> {
    // For now, return 0 as we don't have member functionality yet
    // In the future, this would query a channel_members table
    try {
      const channel = await this.prisma.channel.findUnique({
        where: { id: channelId },
      });

      if (!channel) {
        throw new Error('Channel not found');
      }

      // Placeholder implementation
      return 0;
    } catch (error) {
      throw new Error('Failed to get member count');
    }
  }

  /**
   * Get channel with message count
   */
  async findByIdWithMessageCount(id: string): Promise<(Channel & { messageCount: number }) | null> {
    try {
      const channel = await this.prisma.channel.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              messages: true,
            },
          },
        },
      });

      if (!channel) {
        return null;
      }

      return {
        ...channel,
        messageCount: channel._count.messages,
        _count: undefined,
      } as Channel & { messageCount: number };
    } catch (error) {
      return null;
    }
  }

  /**
   * Search channels by name (partial match)
   */
  async searchByName(searchTerm: string): Promise<Channel[]> {
    try {
      const channels = await this.prisma.channel.findMany({
        where: {
          name: {
            contains: searchTerm.toLowerCase(),
          },
        },
        orderBy: { name: 'asc' },
      });

      return channels;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get channels with recent activity
   */
  async findWithRecentActivity(limit: number = 10): Promise<Channel[]> {
    try {
      // Find channels that have messages, ordered by most recent message
      const channels = await this.prisma.channel.findMany({
        where: {
          messages: {
            some: {},
          },
        },
        include: {
          messages: {
            orderBy: { timestamp: 'desc' },
            take: 1,
            select: { timestamp: true },
          },
        },
        take: limit,
      });

      // Sort by most recent message timestamp
      const sortedChannels = channels
        .map(channel => ({
          ...channel,
          lastMessageTime: channel.messages[0]?.timestamp || channel.createdAt,
          messages: undefined,
        }))
        .sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime())
        .map(({ lastMessageTime, ...channel }) => channel as Channel);

      return sortedChannels;
    } catch (error) {
      return [];
    }
  }

  /**
   * Disconnect Prisma client
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}