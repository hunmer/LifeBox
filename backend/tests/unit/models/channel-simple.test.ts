import { describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { ChannelModel } from '../../../src/models/channel.model';

describe('ChannelModel Basic Tests', () => {
  let prisma: PrismaClient;
  let channelModel: ChannelModel;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: 'file:./test-simple.db'
        }
      }
    });
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    channelModel = new ChannelModel(prisma);
    // Clean up
    await prisma.message.deleteMany({});
    await prisma.channel.deleteMany({});
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
});