import { Channel } from '@prisma/client';
import { ChannelModel, ChannelCreateInput, ChannelUpdateInput } from '@/models/channel.model.js';
import { MessageModel, MessageStatistics } from '@/models/message.model.js';

export interface ChannelWithMessages {
  channel: Channel;
  messages: any[];
}

export interface ChannelWithStatistics {
  channel: Channel;
  statistics: MessageStatistics;
}

/**
 * Business logic service for channel operations
 */
export class ChannelService {
  private channelModel: ChannelModel;
  private messageModel: MessageModel;

  constructor(channelModel?: ChannelModel, messageModel?: MessageModel) {
    this.channelModel = channelModel || new ChannelModel();
    this.messageModel = messageModel || new MessageModel();
  }

  /**
   * Create a new channel
   */
  async createChannel(data: ChannelCreateInput): Promise<Channel> {
    try {
      const channel = await this.channelModel.create(data);
      return channel;
    } catch (error) {
      // Re-throw any validation or database errors
      throw error;
    }
  }

  /**
   * Get all channels
   */
  async getAllChannels(): Promise<Channel[]> {
    try {
      const channels = await this.channelModel.findAll();
      return channels;
    } catch (error) {
      console.error('Error getting all channels:', error);
      return [];
    }
  }

  /**
   * Get channel by ID
   */
  async getChannelById(id: string): Promise<Channel | null> {
    try {
      const channel = await this.channelModel.findById(id);
      return channel;
    } catch (error) {
      console.error(`Error getting channel ${id}:`, error);
      return null;
    }
  }

  /**
   * Get channel by name
   */
  async getChannelByName(name: string): Promise<Channel | null> {
    try {
      const channel = await this.channelModel.findByName(name);
      return channel;
    } catch (error) {
      console.error(`Error getting channel by name ${name}:`, error);
      return null;
    }
  }

  /**
   * Update channel
   */
  async updateChannel(id: string, data: ChannelUpdateInput): Promise<Channel | null> {
    try {
      const channel = await this.channelModel.update(id, data);
      return channel;
    } catch (error) {
      // Re-throw validation errors but log other errors
      if (error instanceof Error && error.message.includes('already exists')) {
        throw error;
      }
      console.error(`Error updating channel ${id}:`, error);
      return null;
    }
  }

  /**
   * Delete channel
   */
  async deleteChannel(id: string): Promise<boolean> {
    try {
      const success = await this.channelModel.delete(id);
      return success;
    } catch (error) {
      console.error(`Error deleting channel ${id}:`, error);
      return false;
    }
  }

  /**
   * Get channel with its messages
   */
  async getChannelWithMessages(id: string): Promise<ChannelWithMessages | null> {
    try {
      const channel = await this.channelModel.findById(id);
      if (!channel) {
        return null;
      }

      const messages = await this.messageModel.findByChannelId(id);
      
      return {
        channel,
        messages,
      };
    } catch (error) {
      console.error(`Error getting channel ${id} with messages:`, error);
      return null;
    }
  }

  /**
   * Get channel with paginated messages
   */
  async getChannelWithMessagesPaginated(
    id: string, 
    page: number = 1, 
    limit: number = 50
  ): Promise<ChannelWithMessages | null> {
    try {
      const channel = await this.channelModel.findById(id);
      if (!channel) {
        return null;
      }

      const messages = await this.messageModel.findByChannelIdPaginated(id, page, limit);
      
      return {
        channel,
        messages,
      };
    } catch (error) {
      console.error(`Error getting channel ${id} with paginated messages:`, error);
      return null;
    }
  }

  /**
   * Get channel statistics
   */
  async getChannelStatistics(id: string): Promise<ChannelWithStatistics | null> {
    try {
      const channel = await this.channelModel.findById(id);
      if (!channel) {
        return null;
      }

      const statistics = await this.messageModel.getMessageStatistics(id);
      
      return {
        channel,
        statistics,
      };
    } catch (error) {
      console.error(`Error getting channel ${id} statistics:`, error);
      return null;
    }
  }

  /**
   * Search channels by name
   */
  async searchChannels(searchTerm: string): Promise<Channel[]> {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return [];
      }

      const channels = await this.channelModel.searchByName(searchTerm.trim());
      return channels;
    } catch (error) {
      console.error(`Error searching channels with term "${searchTerm}":`, error);
      return [];
    }
  }

  /**
   * Get channels with recent activity
   */
  async getChannelsWithRecentActivity(limit: number = 10): Promise<Channel[]> {
    try {
      const channels = await this.channelModel.findWithRecentActivity(limit);
      return channels;
    } catch (error) {
      console.error('Error getting channels with recent activity:', error);
      return [];
    }
  }

  /**
   * Get channel with message count
   */
  async getChannelWithMessageCount(id: string): Promise<(Channel & { messageCount: number }) | null> {
    try {
      const channelWithCount = await this.channelModel.findByIdWithMessageCount(id);
      return channelWithCount;
    } catch (error) {
      console.error(`Error getting channel ${id} with message count:`, error);
      return null;
    }
  }

  /**
   * Validate channel exists
   */
  async validateChannelExists(id: string): Promise<boolean> {
    try {
      const channel = await this.channelModel.findById(id);
      return channel !== null;
    } catch (error) {
      console.error(`Error validating channel ${id} exists:`, error);
      return false;
    }
  }

  /**
   * Get member count for a channel (placeholder for future implementation)
   */
  async getChannelMemberCount(id: string): Promise<number> {
    try {
      const memberCount = await this.channelModel.getMemberCount(id);
      return memberCount;
    } catch (error) {
      console.error(`Error getting member count for channel ${id}:`, error);
      return 0;
    }
  }

  /**
   * Cleanup - disconnect database connections
   */
  async cleanup(): Promise<void> {
    try {
      await this.channelModel.disconnect();
      await this.messageModel.disconnect();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}