import { Message } from '@prisma/client';
import { MessageModel, MessageCreateInput, MessageUpdateInput, MessageTypeEnum, MessageStatistics } from '@/models/message.model.js';
import { ChannelModel } from '@/models/channel.model.js';

/**
 * Business logic service for message operations
 */
export class MessageService {
  private messageModel: MessageModel;
  private channelModel: ChannelModel;

  constructor(messageModel?: MessageModel, channelModel?: ChannelModel) {
    this.messageModel = messageModel || new MessageModel();
    this.channelModel = channelModel || new ChannelModel();
  }

  /**
   * Create a new message
   */
  async createMessage(data: MessageCreateInput): Promise<Message> {
    try {
      const message = await this.messageModel.create(data);
      return message;
    } catch (error) {
      // Re-throw any validation or database errors
      throw error;
    }
  }

  /**
   * Get message by ID
   */
  async getMessageById(id: string): Promise<Message | null> {
    try {
      const message = await this.messageModel.findById(id);
      return message;
    } catch (error) {
      console.error(`Error getting message ${id}:`, error);
      return null;
    }
  }

  /**
   * Get all messages in a channel
   */
  async getMessagesByChannelId(channelId: string): Promise<Message[]> {
    try {
      const messages = await this.messageModel.findByChannelId(channelId);
      return messages;
    } catch (error) {
      console.error(`Error getting messages for channel ${channelId}:`, error);
      return [];
    }
  }

  /**
   * Get paginated messages in a channel
   */
  async getMessagesByChannelIdPaginated(
    channelId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<Message[]> {
    try {
      const messages = await this.messageModel.findByChannelIdPaginated(channelId, page, limit);
      return messages;
    } catch (error) {
      console.error(`Error getting paginated messages for channel ${channelId}:`, error);
      return [];
    }
  }

  /**
   * Update message
   */
  async updateMessage(id: string, data: MessageUpdateInput): Promise<Message | null> {
    try {
      const message = await this.messageModel.update(id, data);
      return message;
    } catch (error) {
      console.error(`Error updating message ${id}:`, error);
      return null;
    }
  }

  /**
   * Delete message
   */
  async deleteMessage(id: string): Promise<boolean> {
    try {
      const success = await this.messageModel.delete(id);
      return success;
    } catch (error) {
      console.error(`Error deleting message ${id}:`, error);
      return false;
    }
  }

  /**
   * Delete all messages in a channel
   */
  async deleteMessagesByChannelId(channelId: string): Promise<number> {
    try {
      const deletedCount = await this.messageModel.deleteByChannelId(channelId);
      return deletedCount;
    } catch (error) {
      console.error(`Error deleting messages for channel ${channelId}:`, error);
      return 0;
    }
  }

  /**
   * Get messages by author
   */
  async getMessagesByAuthor(author: string): Promise<Message[]> {
    try {
      const messages = await this.messageModel.findByAuthor(author);
      return messages;
    } catch (error) {
      console.error(`Error getting messages by author ${author}:`, error);
      return [];
    }
  }

  /**
   * Search messages by content
   */
  async searchMessages(searchTerm: string, channelId?: string): Promise<Message[]> {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return [];
      }

      const messages = await this.messageModel.searchByContent(searchTerm.trim(), channelId);
      return messages;
    } catch (error) {
      console.error(`Error searching messages with term "${searchTerm}":`, error);
      return [];
    }
  }

  /**
   * Get message statistics for a channel
   */
  async getMessageStatistics(channelId: string): Promise<MessageStatistics> {
    try {
      const statistics = await this.messageModel.getMessageStatistics(channelId);
      return statistics;
    } catch (error) {
      console.error(`Error getting message statistics for channel ${channelId}:`, error);
      return {
        total: 0,
        byType: { text: 0, image: 0, file: 0 },
        byAuthor: {},
      };
    }
  }

  /**
   * Get recent messages across all channels
   */
  async getRecentMessages(limit: number = 50): Promise<Message[]> {
    try {
      const messages = await this.messageModel.getRecentMessages(limit);
      return messages;
    } catch (error) {
      console.error('Error getting recent messages:', error);
      return [];
    }
  }

  /**
   * Get messages by type in a channel
   */
  async getMessagesByType(channelId: string, type: MessageTypeEnum): Promise<Message[]> {
    try {
      const messages = await this.messageModel.findByChannelIdAndType(channelId, type);
      return messages;
    } catch (error) {
      console.error(`Error getting ${type} messages for channel ${channelId}:`, error);
      return [];
    }
  }

  /**
   * Get message count for a channel
   */
  async getMessageCount(channelId: string): Promise<number> {
    try {
      const count = await this.messageModel.countByChannelId(channelId);
      return count;
    } catch (error) {
      console.error(`Error getting message count for channel ${channelId}:`, error);
      return 0;
    }
  }

  /**
   * Get messages within a time range
   */
  async getMessagesByTimeRange(
    channelId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Message[]> {
    try {
      const messages = await this.messageModel.findByTimeRange(channelId, startTime, endTime);
      return messages;
    } catch (error) {
      console.error(`Error getting messages by time range for channel ${channelId}:`, error);
      return [];
    }
  }

  /**
   * Validate message exists
   */
  async validateMessageExists(id: string): Promise<boolean> {
    try {
      const message = await this.messageModel.findById(id);
      return message !== null;
    } catch (error) {
      console.error(`Error validating message ${id} exists:`, error);
      return false;
    }
  }

  /**
   * Validate channel exists (using channel model)
   */
  async validateChannelExists(channelId: string): Promise<boolean> {
    try {
      const channel = await this.channelModel.findById(channelId);
      return channel !== null;
    } catch (error) {
      console.error(`Error validating channel ${channelId} exists:`, error);
      return false;
    }
  }

  /**
   * Create message with channel validation
   */
  async createMessageWithValidation(data: MessageCreateInput): Promise<Message> {
    try {
      // First validate that the channel exists
      const channelExists = await this.validateChannelExists(data.channelId);
      if (!channelExists) {
        throw new Error(`Channel with ID '${data.channelId}' does not exist`);
      }

      // Create the message
      const message = await this.messageModel.create(data);
      return message;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get messages with enhanced information (including channel details)
   */
  async getMessagesWithChannelInfo(channelId: string): Promise<Message[]> {
    try {
      // First validate channel exists
      const channelExists = await this.validateChannelExists(channelId);
      if (!channelExists) {
        throw new Error(`Channel with ID '${channelId}' does not exist`);
      }

      const messages = await this.messageModel.findByChannelId(channelId);
      return messages;
    } catch (error) {
      console.error(`Error getting messages with channel info for ${channelId}:`, error);
      return [];
    }
  }

  /**
   * Bulk delete messages by IDs
   */
  async bulkDeleteMessages(messageIds: string[]): Promise<number> {
    try {
      let deletedCount = 0;
      
      for (const messageId of messageIds) {
        const success = await this.messageModel.delete(messageId);
        if (success) {
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Error bulk deleting messages:', error);
      return 0;
    }
  }

  /**
   * Get message summary for a channel
   */
  async getChannelMessageSummary(channelId: string): Promise<{
    totalMessages: number;
    statistics: MessageStatistics;
    recentMessages: Message[];
  }> {
    try {
      const [totalMessages, statistics, recentMessages] = await Promise.all([
        this.getMessageCount(channelId),
        this.getMessageStatistics(channelId),
        this.getMessagesByChannelIdPaginated(channelId, 1, 10), // Last 10 messages
      ]);

      return {
        totalMessages,
        statistics,
        recentMessages,
      };
    } catch (error) {
      console.error(`Error getting message summary for channel ${channelId}:`, error);
      return {
        totalMessages: 0,
        statistics: {
          total: 0,
          byType: { text: 0, image: 0, file: 0 },
          byAuthor: {},
        },
        recentMessages: [],
      };
    }
  }

  /**
   * Cleanup - disconnect database connections
   */
  async cleanup(): Promise<void> {
    try {
      await this.messageModel.disconnect();
      await this.channelModel.disconnect();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}