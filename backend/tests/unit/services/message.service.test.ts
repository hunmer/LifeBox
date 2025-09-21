import { MessageService } from '@/services/message.service';
import { MessageModel } from '@/models/message.model';
import { ChannelModel } from '@/models/channel.model';
import { Message } from '@prisma/client';

// Mock the models
jest.mock('@/models/message.model');
jest.mock('@/models/channel.model');

const MockMessageModel = MessageModel as jest.MockedClass<typeof MessageModel>;
const MockChannelModel = ChannelModel as jest.MockedClass<typeof ChannelModel>;

describe('MessageService', () => {
  let messageService: MessageService;
  let mockMessageModel: jest.Mocked<MessageModel>;
  let mockChannelModel: jest.Mocked<ChannelModel>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockMessageModel = new MockMessageModel() as jest.Mocked<MessageModel>;
    mockChannelModel = new MockChannelModel() as jest.Mocked<ChannelModel>;
    
    messageService = new MessageService(mockMessageModel, mockChannelModel);
  });

  describe('createMessage', () => {
    it('should create a new message successfully', async () => {
      // Arrange
      const messageData = {
        content: 'Hello World',
        author: 'user1',
        type: 'text' as const,
        channelId: 'channel-1'
      };
      const mockMessage: Message = {
        id: 'message-1',
        content: 'Hello World',
        author: 'user1',
        type: 'text',
        channelId: 'channel-1',
        timestamp: new Date(),
      };

      mockMessageModel.create.mockResolvedValue(mockMessage);

      // Act
      const result = await messageService.createMessage(messageData);

      // Assert
      expect(mockMessageModel.create).toHaveBeenCalledWith(messageData);
      expect(result).toEqual(mockMessage);
    });

    it('should throw error when channel does not exist', async () => {
      // Arrange
      const messageData = {
        content: 'Hello World',
        author: 'user1',
        type: 'text' as const,
        channelId: 'non-existent-channel'
      };
      mockMessageModel.create.mockRejectedValue(new Error("Channel with ID 'non-existent-channel' does not exist"));

      // Act & Assert
      await expect(messageService.createMessage(messageData)).rejects.toThrow("Channel with ID 'non-existent-channel' does not exist");
    });

    it('should create message with different types', async () => {
      // Arrange
      const messageData = {
        content: 'image.jpg',
        author: 'user1',
        type: 'image' as const,
        channelId: 'channel-1'
      };
      const mockMessage: Message = {
        id: 'message-1',
        content: 'image.jpg',
        author: 'user1',
        type: 'image',
        channelId: 'channel-1',
        timestamp: new Date(),
      };

      mockMessageModel.create.mockResolvedValue(mockMessage);

      // Act
      const result = await messageService.createMessage(messageData);

      // Assert
      expect(result.type).toBe('image');
    });
  });

  describe('getMessageById', () => {
    it('should return message when found', async () => {
      // Arrange
      const messageId = 'message-1';
      const mockMessage: Message = {
        id: messageId,
        content: 'Hello World',
        author: 'user1',
        type: 'text',
        channelId: 'channel-1',
        timestamp: new Date(),
      };

      mockMessageModel.findById.mockResolvedValue(mockMessage);

      // Act
      const result = await messageService.getMessageById(messageId);

      // Assert
      expect(mockMessageModel.findById).toHaveBeenCalledWith(messageId);
      expect(result).toEqual(mockMessage);
    });

    it('should return null when message not found', async () => {
      // Arrange
      const messageId = 'non-existent';
      mockMessageModel.findById.mockResolvedValue(null);

      // Act
      const result = await messageService.getMessageById(messageId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getMessagesByChannelId', () => {
    it('should return messages for a channel', async () => {
      // Arrange
      const channelId = 'channel-1';
      const mockMessages: Message[] = [
        {
          id: 'message-1',
          content: 'Hello',
          author: 'user1',
          type: 'text',
          channelId,
          timestamp: new Date('2023-01-01'),
        },
        {
          id: 'message-2',
          content: 'World',
          author: 'user2',
          type: 'text',
          channelId,
          timestamp: new Date('2023-01-02'),
        },
      ];

      mockMessageModel.findByChannelId.mockResolvedValue(mockMessages);

      // Act
      const result = await messageService.getMessagesByChannelId(channelId);

      // Assert
      expect(mockMessageModel.findByChannelId).toHaveBeenCalledWith(channelId);
      expect(result).toEqual(mockMessages);
    });

    it('should return empty array when no messages exist', async () => {
      // Arrange
      const channelId = 'empty-channel';
      mockMessageModel.findByChannelId.mockResolvedValue([]);

      // Act
      const result = await messageService.getMessagesByChannelId(channelId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getMessagesByChannelIdPaginated', () => {
    it('should return paginated messages', async () => {
      // Arrange
      const channelId = 'channel-1';
      const page = 1;
      const limit = 10;
      const mockMessages: Message[] = [
        {
          id: 'message-1',
          content: 'Hello',
          author: 'user1',
          type: 'text',
          channelId,
          timestamp: new Date(),
        },
      ];

      mockMessageModel.findByChannelIdPaginated.mockResolvedValue(mockMessages);

      // Act
      const result = await messageService.getMessagesByChannelIdPaginated(channelId, page, limit);

      // Assert
      expect(mockMessageModel.findByChannelIdPaginated).toHaveBeenCalledWith(channelId, page, limit);
      expect(result).toEqual(mockMessages);
    });

    it('should use default pagination values', async () => {
      // Arrange
      const channelId = 'channel-1';
      const mockMessages: Message[] = [];

      mockMessageModel.findByChannelIdPaginated.mockResolvedValue(mockMessages);

      // Act
      const result = await messageService.getMessagesByChannelIdPaginated(channelId);

      // Assert
      expect(mockMessageModel.findByChannelIdPaginated).toHaveBeenCalledWith(channelId, 1, 50);
    });
  });

  describe('updateMessage', () => {
    it('should update message successfully', async () => {
      // Arrange
      const messageId = 'message-1';
      const updateData = { content: 'Updated content' };
      const mockUpdatedMessage: Message = {
        id: messageId,
        content: 'Updated content',
        author: 'user1',
        type: 'text',
        channelId: 'channel-1',
        timestamp: new Date(),
      };

      mockMessageModel.update.mockResolvedValue(mockUpdatedMessage);

      // Act
      const result = await messageService.updateMessage(messageId, updateData);

      // Assert
      expect(mockMessageModel.update).toHaveBeenCalledWith(messageId, updateData);
      expect(result).toEqual(mockUpdatedMessage);
    });

    it('should return null when message to update does not exist', async () => {
      // Arrange
      const messageId = 'non-existent';
      const updateData = { content: 'Updated content' };
      mockMessageModel.update.mockResolvedValue(null);

      // Act
      const result = await messageService.updateMessage(messageId, updateData);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('deleteMessage', () => {
    it('should delete message successfully', async () => {
      // Arrange
      const messageId = 'message-1';
      mockMessageModel.delete.mockResolvedValue(true);

      // Act
      const result = await messageService.deleteMessage(messageId);

      // Assert
      expect(mockMessageModel.delete).toHaveBeenCalledWith(messageId);
      expect(result).toBe(true);
    });

    it('should return false when message to delete does not exist', async () => {
      // Arrange
      const messageId = 'non-existent';
      mockMessageModel.delete.mockResolvedValue(false);

      // Act
      const result = await messageService.deleteMessage(messageId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getMessagesByAuthor', () => {
    it('should return messages by author', async () => {
      // Arrange
      const author = 'user1';
      const mockMessages: Message[] = [
        {
          id: 'message-1',
          content: 'Hello from user1',
          author: 'user1',
          type: 'text',
          channelId: 'channel-1',
          timestamp: new Date(),
        },
      ];

      mockMessageModel.findByAuthor.mockResolvedValue(mockMessages);

      // Act
      const result = await messageService.getMessagesByAuthor(author);

      // Assert
      expect(mockMessageModel.findByAuthor).toHaveBeenCalledWith(author);
      expect(result).toEqual(mockMessages);
    });
  });

  describe('searchMessages', () => {
    it('should search messages by content', async () => {
      // Arrange
      const searchTerm = 'hello';
      const mockMessages: Message[] = [
        {
          id: 'message-1',
          content: 'Hello World',
          author: 'user1',
          type: 'text',
          channelId: 'channel-1',
          timestamp: new Date(),
        },
      ];

      mockMessageModel.searchByContent.mockResolvedValue(mockMessages);

      // Act
      const result = await messageService.searchMessages(searchTerm);

      // Assert
      expect(mockMessageModel.searchByContent).toHaveBeenCalledWith(searchTerm, undefined);
      expect(result).toEqual(mockMessages);
    });

    it('should search messages in specific channel', async () => {
      // Arrange
      const searchTerm = 'hello';
      const channelId = 'channel-1';
      mockMessageModel.searchByContent.mockResolvedValue([]);

      // Act
      await messageService.searchMessages(searchTerm, channelId);

      // Assert
      expect(mockMessageModel.searchByContent).toHaveBeenCalledWith(searchTerm, channelId);
    });

    it('should return empty array for empty search term', async () => {
      // Arrange
      const searchTerm = '';

      // Act
      const result = await messageService.searchMessages(searchTerm);

      // Assert
      expect(mockMessageModel.searchByContent).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('getMessageStatistics', () => {
    it('should return message statistics', async () => {
      // Arrange
      const channelId = 'channel-1';
      const mockStats = {
        total: 10,
        byType: { text: 8, image: 1, file: 1 },
        byAuthor: { user1: 5, user2: 5 },
      };

      mockMessageModel.getMessageStatistics.mockResolvedValue(mockStats);

      // Act
      const result = await messageService.getMessageStatistics(channelId);

      // Assert
      expect(mockMessageModel.getMessageStatistics).toHaveBeenCalledWith(channelId);
      expect(result).toEqual(mockStats);
    });
  });

  describe('deleteMessagesByChannelId', () => {
    it('should delete all messages in a channel', async () => {
      // Arrange
      const channelId = 'channel-1';
      const deletedCount = 5;
      mockMessageModel.deleteByChannelId.mockResolvedValue(deletedCount);

      // Act
      const result = await messageService.deleteMessagesByChannelId(channelId);

      // Assert
      expect(mockMessageModel.deleteByChannelId).toHaveBeenCalledWith(channelId);
      expect(result).toBe(deletedCount);
    });
  });

  describe('getRecentMessages', () => {
    it('should return recent messages with default limit', async () => {
      // Arrange
      const mockMessages: Message[] = [
        {
          id: 'message-1',
          content: 'Recent message',
          author: 'user1',
          type: 'text',
          channelId: 'channel-1',
          timestamp: new Date(),
        },
      ];

      mockMessageModel.getRecentMessages.mockResolvedValue(mockMessages);

      // Act
      const result = await messageService.getRecentMessages();

      // Assert
      expect(mockMessageModel.getRecentMessages).toHaveBeenCalledWith(50);
      expect(result).toEqual(mockMessages);
    });

    it('should return recent messages with custom limit', async () => {
      // Arrange
      const limit = 10;
      mockMessageModel.getRecentMessages.mockResolvedValue([]);

      // Act
      await messageService.getRecentMessages(limit);

      // Assert
      expect(mockMessageModel.getRecentMessages).toHaveBeenCalledWith(limit);
    });
  });

  describe('getMessagesByType', () => {
    it('should return messages by type', async () => {
      // Arrange
      const channelId = 'channel-1';
      const type = 'image';
      const mockMessages: Message[] = [
        {
          id: 'message-1',
          content: 'image.jpg',
          author: 'user1',
          type: 'image',
          channelId,
          timestamp: new Date(),
        },
      ];

      mockMessageModel.findByChannelIdAndType.mockResolvedValue(mockMessages);

      // Act
      const result = await messageService.getMessagesByType(channelId, type);

      // Assert
      expect(mockMessageModel.findByChannelIdAndType).toHaveBeenCalledWith(channelId, type);
      expect(result).toEqual(mockMessages);
    });
  });

  describe('getMessageCount', () => {
    it('should return message count for channel', async () => {
      // Arrange
      const channelId = 'channel-1';
      const count = 25;
      mockMessageModel.countByChannelId.mockResolvedValue(count);

      // Act
      const result = await messageService.getMessageCount(channelId);

      // Assert
      expect(mockMessageModel.countByChannelId).toHaveBeenCalledWith(channelId);
      expect(result).toBe(count);
    });
  });

  describe('validateMessageExists', () => {
    it('should return true when message exists', async () => {
      // Arrange
      const messageId = 'message-1';
      const mockMessage: Message = {
        id: messageId,
        content: 'Hello',
        author: 'user1',
        type: 'text',
        channelId: 'channel-1',
        timestamp: new Date(),
      };
      mockMessageModel.findById.mockResolvedValue(mockMessage);

      // Act
      const result = await messageService.validateMessageExists(messageId);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when message does not exist', async () => {
      // Arrange
      const messageId = 'non-existent';
      mockMessageModel.findById.mockResolvedValue(null);

      // Act
      const result = await messageService.validateMessageExists(messageId);

      // Assert
      expect(result).toBe(false);
    });
  });
});