import { describe, it, expect, beforeEach } from '@jest/globals';
import { MessageModel } from '../../../src/models/message.model';
import { ChannelModel } from '../../../src/models/channel.model';
import { Message, Channel } from '@prisma/client';
import { prisma } from '../../setup';

describe('MessageModel', () => {
  let messageModel: MessageModel;
  let channelModel: ChannelModel;
  let testChannel: Channel;

  beforeEach(async () => {
    messageModel = new MessageModel(prisma);
    channelModel = new ChannelModel(prisma);
    
    // Create a test channel for message tests
    testChannel = await channelModel.create({
      name: 'test-channel',
      description: 'Channel for message testing',
    });
  });

  describe('create', () => {
    it('should create a new text message', async () => {
      const messageData = {
        content: 'Hello, world!',
        author: 'testuser',
        type: 'text' as const,
        channelId: testChannel.id,
      };

      const result = await messageModel.create(messageData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.content).toBe(messageData.content);
      expect(result.author).toBe(messageData.author);
      expect(result.type).toBe(messageData.type);
      expect(result.channelId).toBe(messageData.channelId);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should create a message with default type as text', async () => {
      const messageData = {
        content: 'Message without type',
        author: 'testuser',
        channelId: testChannel.id,
      };

      const result = await messageModel.create(messageData);

      expect(result.type).toBe('text');
    });

    it('should create messages of different types', async () => {
      const messageTypes = ['text', 'image', 'file'] as const;

      for (const type of messageTypes) {
        const messageData = {
          content: `Message of type ${type}`,
          author: 'testuser',
          type,
          channelId: testChannel.id,
        };

        const result = await messageModel.create(messageData);
        expect(result.type).toBe(type);
      }
    });

    it('should throw error when creating message with invalid channel', async () => {
      const messageData = {
        content: 'Message for invalid channel',
        author: 'testuser',
        channelId: 'invalid-channel-id',
      };

      await expect(messageModel.create(messageData)).rejects.toThrow();
    });

    it('should throw error when creating message with empty content', async () => {
      const messageData = {
        content: '',
        author: 'testuser',
        channelId: testChannel.id,
      };

      await expect(messageModel.create(messageData)).rejects.toThrow();
    });

    it('should throw error when creating message with empty author', async () => {
      const messageData = {
        content: 'Message without author',
        author: '',
        channelId: testChannel.id,
      };

      await expect(messageModel.create(messageData)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find message by id', async () => {
      const messageData = {
        content: 'Test message',
        author: 'testuser',
        channelId: testChannel.id,
      };

      const created = await messageModel.create(messageData);
      const found = await messageModel.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.content).toBe(messageData.content);
    });

    it('should return null for non-existent message', async () => {
      const found = await messageModel.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findByChannelId', () => {
    it('should find all messages in a channel', async () => {
      const messages = [
        { content: 'First message', author: 'user1', channelId: testChannel.id },
        { content: 'Second message', author: 'user2', channelId: testChannel.id },
        { content: 'Third message', author: 'user1', channelId: testChannel.id },
      ];

      for (const messageData of messages) {
        await messageModel.create(messageData);
      }

      const channelMessages = await messageModel.findByChannelId(testChannel.id);

      expect(channelMessages).toHaveLength(3);
      expect(channelMessages.map(m => m.content)).toEqual(
        expect.arrayContaining(['First message', 'Second message', 'Third message'])
      );
    });

    it('should return empty array for channel with no messages', async () => {
      const emptyChannel = await channelModel.create({
        name: 'empty-channel',
      });

      const messages = await messageModel.findByChannelId(emptyChannel.id);
      expect(messages).toEqual([]);
    });

    it('should return messages ordered by timestamp ascending', async () => {
      const messages = [
        { content: 'Oldest message', author: 'user1', channelId: testChannel.id },
        { content: 'Middle message', author: 'user2', channelId: testChannel.id },
        { content: 'Newest message', author: 'user3', channelId: testChannel.id },
      ];

      for (const messageData of messages) {
        await messageModel.create(messageData);
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const channelMessages = await messageModel.findByChannelId(testChannel.id);
      
      expect(channelMessages[0].content).toBe('Oldest message');
      expect(channelMessages[1].content).toBe('Middle message');
      expect(channelMessages[2].content).toBe('Newest message');
    });
  });

  describe('findByChannelIdPaginated', () => {
    beforeEach(async () => {
      // Create 10 test messages
      for (let i = 1; i <= 10; i++) {
        await messageModel.create({
          content: `Message ${i}`,
          author: `user${i % 3 + 1}`,
          channelId: testChannel.id,
        });
        await new Promise(resolve => setTimeout(resolve, 5));
      }
    });

    it('should return paginated messages', async () => {
      const page1 = await messageModel.findByChannelIdPaginated(testChannel.id, 1, 5);
      const page2 = await messageModel.findByChannelIdPaginated(testChannel.id, 2, 5);

      expect(page1).toHaveLength(5);
      expect(page2).toHaveLength(5);
      
      // Ensure no overlap
      const page1Ids = page1.map(m => m.id);
      const page2Ids = page2.map(m => m.id);
      expect(page1Ids).not.toEqual(expect.arrayContaining(page2Ids));
    });

    it('should handle page beyond available data', async () => {
      const page = await messageModel.findByChannelIdPaginated(testChannel.id, 10, 5);
      expect(page).toEqual([]);
    });
  });

  describe('findByAuthor', () => {
    it('should find all messages by author', async () => {
      const author = 'specific-user';
      const messages = [
        { content: 'First message from user', author, channelId: testChannel.id },
        { content: 'Second message from user', author, channelId: testChannel.id },
      ];

      // Create messages from the specific author
      for (const messageData of messages) {
        await messageModel.create(messageData);
      }

      // Create a message from a different author
      await messageModel.create({
        content: 'Message from different user',
        author: 'different-user',
        channelId: testChannel.id,
      });

      const authorMessages = await messageModel.findByAuthor(author);

      expect(authorMessages).toHaveLength(2);
      authorMessages.forEach(message => {
        expect(message.author).toBe(author);
      });
    });
  });

  describe('update', () => {
    it('should update message content', async () => {
      const messageData = {
        content: 'Original content',
        author: 'testuser',
        channelId: testChannel.id,
      };

      const created = await messageModel.create(messageData);
      const updatedContent = 'Updated content';

      const updated = await messageModel.update(created.id, { content: updatedContent });

      expect(updated).toBeDefined();
      expect(updated?.content).toBe(updatedContent);
      expect(updated?.author).toBe(messageData.author); // Should remain unchanged
    });

    it('should return null when updating non-existent message', async () => {
      const updated = await messageModel.update('non-existent-id', { content: 'new content' });
      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete message by id', async () => {
      const messageData = {
        content: 'Message to delete',
        author: 'testuser',
        channelId: testChannel.id,
      };

      const created = await messageModel.create(messageData);
      const deleted = await messageModel.delete(created.id);

      expect(deleted).toBe(true);

      const found = await messageModel.findById(created.id);
      expect(found).toBeNull();
    });

    it('should return false when deleting non-existent message', async () => {
      const deleted = await messageModel.delete('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('deleteByChannelId', () => {
    it('should delete all messages in a channel', async () => {
      const messages = [
        { content: 'Message 1', author: 'user1', channelId: testChannel.id },
        { content: 'Message 2', author: 'user2', channelId: testChannel.id },
        { content: 'Message 3', author: 'user3', channelId: testChannel.id },
      ];

      for (const messageData of messages) {
        await messageModel.create(messageData);
      }

      const deletedCount = await messageModel.deleteByChannelId(testChannel.id);
      expect(deletedCount).toBe(3);

      const remainingMessages = await messageModel.findByChannelId(testChannel.id);
      expect(remainingMessages).toEqual([]);
    });
  });

  describe('validation', () => {
    it('should validate message content length', async () => {
      const longContent = 'a'.repeat(10001); // Assuming max length is 10000
      
      await expect(
        messageModel.create({
          content: longContent,
          author: 'testuser',
          channelId: testChannel.id,
        })
      ).rejects.toThrow();
    });

    it('should validate message type', async () => {
      await expect(
        messageModel.create({
          content: 'Test message',
          author: 'testuser',
          type: 'invalid-type' as any,
          channelId: testChannel.id,
        })
      ).rejects.toThrow();
    });
  });

  describe('getMessageStatistics', () => {
    it('should return correct message statistics for channel', async () => {
      const messages = [
        { content: 'Text message 1', author: 'user1', type: 'text' as const, channelId: testChannel.id },
        { content: 'Text message 2', author: 'user2', type: 'text' as const, channelId: testChannel.id },
        { content: 'Image message', author: 'user1', type: 'image' as const, channelId: testChannel.id },
        { content: 'File message', author: 'user3', type: 'file' as const, channelId: testChannel.id },
      ];

      for (const messageData of messages) {
        await messageModel.create(messageData);
      }

      const stats = await messageModel.getMessageStatistics(testChannel.id);

      expect(stats.total).toBe(4);
      expect(stats.byType.text).toBe(2);
      expect(stats.byType.image).toBe(1);
      expect(stats.byType.file).toBe(1);
      expect(stats.byAuthor.user1).toBe(2);
      expect(stats.byAuthor.user2).toBe(1);
      expect(stats.byAuthor.user3).toBe(1);
    });
  });
});