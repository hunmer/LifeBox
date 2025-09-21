import { ChannelService } from '@/services/channel.service';
import { ChannelModel } from '@/models/channel.model';
import { MessageModel } from '@/models/message.model';
import { Channel } from '@prisma/client';

// Mock the models
jest.mock('@/models/channel.model');
jest.mock('@/models/message.model');

const MockChannelModel = ChannelModel as jest.MockedClass<typeof ChannelModel>;
const MockMessageModel = MessageModel as jest.MockedClass<typeof MessageModel>;

describe('ChannelService', () => {
  let channelService: ChannelService;
  let mockChannelModel: jest.Mocked<ChannelModel>;
  let mockMessageModel: jest.Mocked<MessageModel>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockChannelModel = new MockChannelModel() as jest.Mocked<ChannelModel>;
    mockMessageModel = new MockMessageModel() as jest.Mocked<MessageModel>;
    
    channelService = new ChannelService(mockChannelModel, mockMessageModel);
  });

  describe('createChannel', () => {
    it('should create a new channel successfully', async () => {
      // Arrange
      const channelData = { name: 'test-channel', description: 'Test Description' };
      const mockChannel: Channel = {
        id: 'channel-1',
        name: 'test-channel',
        description: 'Test Description',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockChannelModel.create.mockResolvedValue(mockChannel);

      // Act
      const result = await channelService.createChannel(channelData);

      // Assert
      expect(mockChannelModel.create).toHaveBeenCalledWith(channelData);
      expect(result).toEqual(mockChannel);
    });

    it('should throw error when channel name already exists', async () => {
      // Arrange
      const channelData = { name: 'existing-channel', description: 'Test Description' };
      mockChannelModel.create.mockRejectedValue(new Error("Channel with name 'existing-channel' already exists"));

      // Act & Assert
      await expect(channelService.createChannel(channelData)).rejects.toThrow("Channel with name 'existing-channel' already exists");
    });

    it('should create channel without description', async () => {
      // Arrange
      const channelData = { name: 'test-channel' };
      const mockChannel: Channel = {
        id: 'channel-1',
        name: 'test-channel',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockChannelModel.create.mockResolvedValue(mockChannel);

      // Act
      const result = await channelService.createChannel(channelData);

      // Assert
      expect(mockChannelModel.create).toHaveBeenCalledWith(channelData);
      expect(result).toEqual(mockChannel);
    });
  });

  describe('getAllChannels', () => {
    it('should return all channels successfully', async () => {
      // Arrange
      const mockChannels: Channel[] = [
        {
          id: 'channel-1',
          name: 'channel-1',
          description: 'Description 1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'channel-2',
          name: 'channel-2',
          description: 'Description 2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockChannelModel.findAll.mockResolvedValue(mockChannels);

      // Act
      const result = await channelService.getAllChannels();

      // Assert
      expect(mockChannelModel.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockChannels);
    });

    it('should return empty array when no channels exist', async () => {
      // Arrange
      mockChannelModel.findAll.mockResolvedValue([]);

      // Act
      const result = await channelService.getAllChannels();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getChannelById', () => {
    it('should return channel when found', async () => {
      // Arrange
      const channelId = 'channel-1';
      const mockChannel: Channel = {
        id: channelId,
        name: 'test-channel',
        description: 'Test Description',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockChannelModel.findById.mockResolvedValue(mockChannel);

      // Act
      const result = await channelService.getChannelById(channelId);

      // Assert
      expect(mockChannelModel.findById).toHaveBeenCalledWith(channelId);
      expect(result).toEqual(mockChannel);
    });

    it('should return null when channel not found', async () => {
      // Arrange
      const channelId = 'non-existent';
      mockChannelModel.findById.mockResolvedValue(null);

      // Act
      const result = await channelService.getChannelById(channelId);

      // Assert
      expect(mockChannelModel.findById).toHaveBeenCalledWith(channelId);
      expect(result).toBeNull();
    });
  });

  describe('updateChannel', () => {
    it('should update channel successfully', async () => {
      // Arrange
      const channelId = 'channel-1';
      const updateData = { name: 'updated-channel', description: 'Updated Description' };
      const mockUpdatedChannel: Channel = {
        id: channelId,
        name: 'updated-channel',
        description: 'Updated Description',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockChannelModel.update.mockResolvedValue(mockUpdatedChannel);

      // Act
      const result = await channelService.updateChannel(channelId, updateData);

      // Assert
      expect(mockChannelModel.update).toHaveBeenCalledWith(channelId, updateData);
      expect(result).toEqual(mockUpdatedChannel);
    });

    it('should return null when channel to update does not exist', async () => {
      // Arrange
      const channelId = 'non-existent';
      const updateData = { name: 'updated-channel' };
      mockChannelModel.update.mockResolvedValue(null);

      // Act
      const result = await channelService.updateChannel(channelId, updateData);

      // Assert
      expect(mockChannelModel.update).toHaveBeenCalledWith(channelId, updateData);
      expect(result).toBeNull();
    });
  });

  describe('deleteChannel', () => {
    it('should delete channel successfully', async () => {
      // Arrange
      const channelId = 'channel-1';
      mockChannelModel.delete.mockResolvedValue(true);

      // Act
      const result = await channelService.deleteChannel(channelId);

      // Assert
      expect(mockChannelModel.delete).toHaveBeenCalledWith(channelId);
      expect(result).toBe(true);
    });

    it('should return false when channel to delete does not exist', async () => {
      // Arrange
      const channelId = 'non-existent';
      mockChannelModel.delete.mockResolvedValue(false);

      // Act
      const result = await channelService.deleteChannel(channelId);

      // Assert
      expect(mockChannelModel.delete).toHaveBeenCalledWith(channelId);
      expect(result).toBe(false);
    });
  });

  describe('getChannelWithMessages', () => {
    it('should return channel with messages successfully', async () => {
      // Arrange
      const channelId = 'channel-1';
      const mockChannel: Channel = {
        id: channelId,
        name: 'test-channel',
        description: 'Test Description',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMessages = [
        {
          id: 'msg-1',
          content: 'Hello',
          author: 'user1',
          type: 'text',
          channelId,
          timestamp: new Date(),
        },
      ];

      mockChannelModel.findById.mockResolvedValue(mockChannel);
      mockMessageModel.findByChannelId.mockResolvedValue(mockMessages);

      // Act
      const result = await channelService.getChannelWithMessages(channelId);

      // Assert
      expect(mockChannelModel.findById).toHaveBeenCalledWith(channelId);
      expect(mockMessageModel.findByChannelId).toHaveBeenCalledWith(channelId);
      expect(result).toEqual({
        channel: mockChannel,
        messages: mockMessages,
      });
    });

    it('should return null when channel does not exist', async () => {
      // Arrange
      const channelId = 'non-existent';
      mockChannelModel.findById.mockResolvedValue(null);

      // Act
      const result = await channelService.getChannelWithMessages(channelId);

      // Assert
      expect(mockChannelModel.findById).toHaveBeenCalledWith(channelId);
      expect(mockMessageModel.findByChannelId).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('getChannelStatistics', () => {
    it('should return channel statistics successfully', async () => {
      // Arrange
      const channelId = 'channel-1';
      const mockChannel: Channel = {
        id: channelId,
        name: 'test-channel',
        description: 'Test Description',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockStats = {
        total: 10,
        byType: { text: 8, image: 1, file: 1 },
        byAuthor: { user1: 5, user2: 5 },
      };

      mockChannelModel.findById.mockResolvedValue(mockChannel);
      mockMessageModel.getMessageStatistics.mockResolvedValue(mockStats);

      // Act
      const result = await channelService.getChannelStatistics(channelId);

      // Assert
      expect(mockChannelModel.findById).toHaveBeenCalledWith(channelId);
      expect(mockMessageModel.getMessageStatistics).toHaveBeenCalledWith(channelId);
      expect(result).toEqual({
        channel: mockChannel,
        statistics: mockStats,
      });
    });

    it('should return null when channel does not exist', async () => {
      // Arrange
      const channelId = 'non-existent';
      mockChannelModel.findById.mockResolvedValue(null);

      // Act
      const result = await channelService.getChannelStatistics(channelId);

      // Assert
      expect(mockChannelModel.findById).toHaveBeenCalledWith(channelId);
      expect(mockMessageModel.getMessageStatistics).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('searchChannels', () => {
    it('should search channels by name successfully', async () => {
      // Arrange
      const searchTerm = 'test';
      const mockChannels: Channel[] = [
        {
          id: 'channel-1',
          name: 'test-channel',
          description: 'Test Description',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockChannelModel.searchByName.mockResolvedValue(mockChannels);

      // Act
      const result = await channelService.searchChannels(searchTerm);

      // Assert
      expect(mockChannelModel.searchByName).toHaveBeenCalledWith(searchTerm);
      expect(result).toEqual(mockChannels);
    });

    it('should return empty array when no channels match search term', async () => {
      // Arrange
      const searchTerm = 'nonexistent';
      mockChannelModel.searchByName.mockResolvedValue([]);

      // Act
      const result = await channelService.searchChannels(searchTerm);

      // Assert
      expect(result).toEqual([]);
    });
  });
});