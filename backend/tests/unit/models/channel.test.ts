import { describe, it, expect, beforeEach } from '@jest/globals';
import { ChannelModel } from '../../../src/models/channel.model';
import { Channel } from '@prisma/client';
import { prisma } from '../../setup';

describe('ChannelModel', () => {
  let channelModel: ChannelModel;

  beforeEach(() => {
    channelModel = new ChannelModel(prisma);
  });

  describe('create', () => {
    it('should create a new channel with valid data', async () => {
      const channelData = {
        name: 'general',
        description: 'General discussion channel',
      };

      const result = await channelModel.create(channelData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(channelData.name);
      expect(result.description).toBe(channelData.description);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a channel without description', async () => {
      const channelData = {
        name: 'announcements',
      };

      const result = await channelModel.create(channelData);

      expect(result).toBeDefined();
      expect(result.name).toBe(channelData.name);
      expect(result.description).toBeNull();
    });

    it('should throw error when creating channel with duplicate name', async () => {
      const channelData = {
        name: 'duplicate-channel',
        description: 'First channel',
      };

      await channelModel.create(channelData);

      await expect(
        channelModel.create({ name: 'duplicate-channel', description: 'Second channel' })
      ).rejects.toThrow();
    });

    it('should throw error when creating channel with empty name', async () => {
      const channelData = {
        name: '',
        description: 'Channel with empty name',
      };

      await expect(channelModel.create(channelData)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find channel by id', async () => {
      const channelData = {
        name: 'test-channel',
        description: 'Test channel',
      };

      const created = await channelModel.create(channelData);
      const found = await channelModel.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe(channelData.name);
    });

    it('should return null for non-existent channel', async () => {
      const found = await channelModel.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should find channel by name', async () => {
      const channelData = {
        name: 'unique-channel-name',
        description: 'Unique channel',
      };

      await channelModel.create(channelData);
      const found = await channelModel.findByName(channelData.name);

      expect(found).toBeDefined();
      expect(found?.name).toBe(channelData.name);
    });

    it('should return null for non-existent channel name', async () => {
      const found = await channelModel.findByName('non-existent-channel');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all channels', async () => {
      const channels = [
        { name: 'channel-1', description: 'First channel' },
        { name: 'channel-2', description: 'Second channel' },
        { name: 'channel-3' },
      ];

      for (const channelData of channels) {
        await channelModel.create(channelData);
      }

      const allChannels = await channelModel.findAll();

      expect(allChannels).toHaveLength(3);
      expect(allChannels.map(c => c.name)).toEqual(
        expect.arrayContaining(['channel-1', 'channel-2', 'channel-3'])
      );
    });

    it('should return empty array when no channels exist', async () => {
      const allChannels = await channelModel.findAll();
      expect(allChannels).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update channel data', async () => {
      const channelData = {
        name: 'original-name',
        description: 'Original description',
      };

      const created = await channelModel.create(channelData);
      const updateData = {
        name: 'updated-name',
        description: 'Updated description',
      };

      const updated = await channelModel.update(created.id, updateData);

      expect(updated).toBeDefined();
      expect(updated?.name).toBe(updateData.name);
      expect(updated?.description).toBe(updateData.description);
      expect(updated?.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
    });

    it('should return null when updating non-existent channel', async () => {
      const updated = await channelModel.update('non-existent-id', { name: 'new-name' });
      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete channel by id', async () => {
      const channelData = {
        name: 'channel-to-delete',
        description: 'This will be deleted',
      };

      const created = await channelModel.create(channelData);
      const deleted = await channelModel.delete(created.id);

      expect(deleted).toBe(true);

      const found = await channelModel.findById(created.id);
      expect(found).toBeNull();
    });

    it('should return false when deleting non-existent channel', async () => {
      const deleted = await channelModel.delete('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('getMemberCount', () => {
    it('should return correct member count for channel', async () => {
      const channelData = {
        name: 'channel-with-members',
        description: 'Channel for member count test',
      };

      const created = await channelModel.create(channelData);
      const memberCount = await channelModel.getMemberCount(created.id);

      // Initially should be 0 (this is a basic implementation)
      expect(memberCount).toBe(0);
    });
  });

  describe('validation', () => {
    it('should validate channel name length', async () => {
      const longName = 'a'.repeat(256); // Assuming max length is 255
      
      await expect(
        channelModel.create({ name: longName })
      ).rejects.toThrow();
    });

    it('should validate channel name format', async () => {
      const invalidNames = ['channel with spaces', 'channel@#$%', '123channel'];
      
      for (const invalidName of invalidNames) {
        await expect(
          channelModel.create({ name: invalidName })
        ).rejects.toThrow();
      }
    });
  });
});