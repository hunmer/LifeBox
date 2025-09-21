import { PrismaClient, Message, Prisma } from '@prisma/client';
import { z } from 'zod';

// Message type enum
const MessageType = z.enum(['text', 'image', 'file']);
export type MessageTypeEnum = z.infer<typeof MessageType>;

// Validation schemas
const messageCreateSchema = z.object({
  content: z.string()
    .min(1, 'Message content cannot be empty')
    .max(10000, 'Message content too long'),
  author: z.string()
    .min(1, 'Message author cannot be empty')
    .max(255, 'Author name too long'),
  type: MessageType.default('text'),
  channelId: z.string().min(1, 'Channel ID is required'),
});

const messageUpdateSchema = z.object({
  content: z.string()
    .min(1, 'Message content cannot be empty')
    .max(10000, 'Message content too long')
    .optional(),
  type: MessageType.optional(),
});

export type MessageCreateInput = z.infer<typeof messageCreateSchema>;
export type MessageUpdateInput = z.infer<typeof messageUpdateSchema>;

export interface MessageStatistics {
  total: number;
  byType: Record<MessageTypeEnum, number>;
  byAuthor: Record<string, number>;
}

export class MessageModel {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Create a new message
   */
  async create(data: MessageCreateInput): Promise<Message> {
    // Validate input data
    const validatedData = messageCreateSchema.parse(data);

    try {
      // Check if channel exists
      const channel = await this.prisma.channel.findUnique({
        where: { id: validatedData.channelId },
      });

      if (!channel) {
        throw new Error(`Channel with ID '${validatedData.channelId}' does not exist`);
      }

      const message = await this.prisma.message.create({
        data: validatedData,
      });

      return message;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new Error(`Channel with ID '${validatedData.channelId}' does not exist`);
        }
      }
      throw error;
    }
  }

  /**
   * Find message by ID
   */
  async findById(id: string): Promise<Message | null> {
    try {
      const message = await this.prisma.message.findUnique({
        where: { id },
      });

      return message;
    } catch (error) {
      return null;
    }
  }

  /**
   * Find all messages in a channel
   */
  async findByChannelId(channelId: string): Promise<Message[]> {
    try {
      const messages = await this.prisma.message.findMany({
        where: { channelId },
        orderBy: { timestamp: 'asc' },
      });

      return messages;
    } catch (error) {
      return [];
    }
  }

  /**
   * Find messages in a channel with pagination
   */
  async findByChannelIdPaginated(
    channelId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<Message[]> {
    try {
      const skip = (page - 1) * limit;

      const messages = await this.prisma.message.findMany({
        where: { channelId },
        orderBy: { timestamp: 'asc' },
        skip,
        take: limit,
      });

      return messages;
    } catch (error) {
      return [];
    }
  }

  /**
   * Find all messages by author
   */
  async findByAuthor(author: string): Promise<Message[]> {
    try {
      const messages = await this.prisma.message.findMany({
        where: { author },
        orderBy: { timestamp: 'desc' },
      });

      return messages;
    } catch (error) {
      return [];
    }
  }

  /**
   * Update message
   */
  async update(id: string, data: MessageUpdateInput): Promise<Message | null> {
    // Validate input data
    const validatedData = messageUpdateSchema.parse(data);

    try {
      const message = await this.prisma.message.update({
        where: { id },
        data: validatedData,
      });

      return message;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // Record not found
          return null;
        }
      }
      throw error;
    }
  }

  /**
   * Delete message by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.message.delete({
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
   * Delete all messages in a channel
   */
  async deleteByChannelId(channelId: string): Promise<number> {
    try {
      const result = await this.prisma.message.deleteMany({
        where: { channelId },
      });

      return result.count;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get message statistics for a channel
   */
  async getMessageStatistics(channelId: string): Promise<MessageStatistics> {
    try {
      const messages = await this.prisma.message.findMany({
        where: { channelId },
        select: {
          type: true,
          author: true,
        },
      });

      const stats: MessageStatistics = {
        total: messages.length,
        byType: { text: 0, image: 0, file: 0 },
        byAuthor: {},
      };

      for (const message of messages) {
        // Count by type
        const messageType = message.type as MessageTypeEnum;
        if (messageType in stats.byType) {
          stats.byType[messageType]++;
        }

        // Count by author
        if (stats.byAuthor[message.author]) {
          stats.byAuthor[message.author]++;
        } else {
          stats.byAuthor[message.author] = 1;
        }
      }

      return stats;
    } catch (error) {
      return {
        total: 0,
        byType: { text: 0, image: 0, file: 0 },
        byAuthor: {},
      };
    }
  }

  /**
   * Search messages by content
   */
  async searchByContent(searchTerm: string, channelId?: string): Promise<Message[]> {
    try {
      const whereClause: Prisma.MessageWhereInput = {
        content: {
          contains: searchTerm,
        },
      };

      if (channelId) {
        whereClause.channelId = channelId;
      }

      const messages = await this.prisma.message.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
      });

      return messages;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get recent messages across all channels
   */
  async getRecentMessages(limit: number = 50): Promise<Message[]> {
    try {
      const messages = await this.prisma.message.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
      });

      return messages;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get messages by type in a channel
   */
  async findByChannelIdAndType(channelId: string, type: MessageTypeEnum): Promise<Message[]> {
    try {
      const messages = await this.prisma.message.findMany({
        where: {
          channelId,
          type,
        },
        orderBy: { timestamp: 'desc' },
      });

      return messages;
    } catch (error) {
      return [];
    }
  }

  /**
   * Count messages in a channel
   */
  async countByChannelId(channelId: string): Promise<number> {
    try {
      const count = await this.prisma.message.count({
        where: { channelId },
      });

      return count;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get messages within a time range
   */
  async findByTimeRange(
    channelId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Message[]> {
    try {
      const messages = await this.prisma.message.findMany({
        where: {
          channelId,
          timestamp: {
            gte: startTime,
            lte: endTime,
          },
        },
        orderBy: { timestamp: 'asc' },
      });

      return messages;
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